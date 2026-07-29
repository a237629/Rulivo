import type { PatternExplanationOutput } from "./pattern-explanation.contract.js";

export interface EvidenceReportMetric {
  algorithmVersion: string;
  confidenceScore: number;
  counterexampleCount: number;
  dataCompleteness: number;
  dominantStatus: "BALANCED" | "FAIL" | "PASS" | "UNKNOWN";
  effectSize: number;
  evidenceId: string;
  failCount: number;
  knownSampleSize: number;
  level: "HIGH" | "INSUFFICIENT" | "LOW" | "MEDIUM";
  passCount: number;
  patternType:
    "DAILY_TRADE_LIMIT" | "LOSS_REENTRY" | "MOVED_STOP" | "PLAN_DEVIATION" | "POSITION_INCREASE";
  sampleSize: number;
  unknownCount: number;
}

export interface EvidenceReportSnapshot {
  evidenceId: string;
  openedAt: Date;
  patternType: EvidenceReportMetric["patternType"];
  status: "FAIL" | "PASS" | "UNKNOWN";
  symbol: string;
  tradeId: string;
}

function counterexampleStatus(
  dominantStatus: EvidenceReportMetric["dominantStatus"]
): "FAIL" | "PASS" | null {
  if (dominantStatus === "FAIL") return "PASS";
  if (dominantStatus === "PASS") return "FAIL";
  return null;
}

export function buildEvidenceReport(
  metrics: EvidenceReportMetric[],
  snapshots: EvidenceReportSnapshot[],
  explanation: PatternExplanationOutput
) {
  const explanations = new Map(explanation.explanations.map((item) => [item.pattern_type, item]));
  return {
    generatedFrom: "calculated-metrics-and-current-evidence",
    patterns: metrics.map((metric) => {
      const item = explanations.get(metric.patternType);
      if (item === undefined) throw new RangeError("Pattern explanation is missing");
      const patternSnapshots = snapshots
        .filter((snapshot) => snapshot.patternType === metric.patternType)
        .sort((left, right) => right.openedAt.valueOf() - left.openedAt.valueOf());
      const opposite = counterexampleStatus(metric.dominantStatus);
      const limitations = [...item.limitations];
      if (metric.level === "INSUFFICIENT") limitations.push("INSUFFICIENT_SAMPLE");
      if (metric.dataCompleteness < 1) limitations.push("INCOMPLETE_DATA");
      if (patternSnapshots.length > 20) limitations.push("RELATED_TRADES_TRUNCATED");
      const openedTimes = patternSnapshots.map(({ openedAt }) => openedAt.valueOf());
      return {
        conclusion: item.conclusion,
        counterexamples: patternSnapshots
          .filter(({ status }) => status === opposite)
          .slice(0, 20)
          .map(({ evidenceId, openedAt, status, symbol, tradeId }) => ({
            evidenceId,
            openedAt: openedAt.toISOString(),
            status,
            symbol,
            tradeId
          })),
        impact: {
          confidenceScore: metric.confidenceScore,
          dataCompleteness: metric.dataCompleteness,
          dominantStatus: metric.dominantStatus,
          effectSize: metric.effectSize,
          level: metric.level
        },
        limitations: [...new Set(limitations)],
        numericClaims: item.numeric_claims,
        patternType: metric.patternType,
        relatedTrades: patternSnapshots
          .slice(0, 20)
          .map(({ evidenceId, openedAt, status, symbol, tradeId }) => ({
            evidenceId,
            openedAt: openedAt.toISOString(),
            status,
            symbol,
            tradeId
          })),
        sample: {
          counterexampleCount: metric.counterexampleCount,
          evidenceId: metric.evidenceId,
          failCount: metric.failCount,
          knownSampleSize: metric.knownSampleSize,
          passCount: metric.passCount,
          sampleSize: metric.sampleSize,
          unknownCount: metric.unknownCount
        },
        timeWindow:
          openedTimes.length === 0
            ? null
            : {
                from: new Date(Math.min(...openedTimes)).toISOString(),
                to: new Date(Math.max(...openedTimes)).toISOString()
              }
      };
    })
  };
}
