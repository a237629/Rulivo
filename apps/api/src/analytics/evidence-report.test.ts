import { describe, expect, it } from "vitest";
import { buildEvidenceReport } from "./evidence-report.js";

const metricId = "0770fc2c-e379-4c09-9813-316d06b35c17";

describe("evidence report", () => {
  it("combines conclusions, samples, impact, windows, trades, counterexamples and limitations", () => {
    const report = buildEvidenceReport(
      [
        {
          algorithmVersion: "pattern-confidence-v1",
          confidenceScore: 83,
          counterexampleCount: 1,
          dataCompleteness: 0.8,
          dominantStatus: "FAIL",
          effectSize: 0.8,
          evidenceId: metricId,
          failCount: 8,
          knownSampleSize: 10,
          level: "HIGH",
          passCount: 2,
          patternType: "LOSS_REENTRY",
          sampleSize: 12,
          unknownCount: 2
        }
      ],
      [
        {
          evidenceId: "f23df47a-4ae4-4280-8dde-e293bbb120f1",
          openedAt: new Date("2026-07-01T00:00:00Z"),
          patternType: "LOSS_REENTRY",
          status: "FAIL",
          symbol: "AAPL",
          tradeId: "trade-1"
        },
        {
          evidenceId: "b4be8f03-20d0-4c96-b02f-7afcd932c88b",
          openedAt: new Date("2026-07-10T00:00:00Z"),
          patternType: "LOSS_REENTRY",
          status: "PASS",
          symbol: "MSFT",
          tradeId: "trade-2"
        }
      ],
      {
        explanations: [
          {
            conclusion: "亏损后再次入场的失败行为占主导。",
            limitations: ["当前结论只覆盖已记录交易。"],
            numeric_claims: [{ evidence_id: metricId, metric: "CONFIDENCE_SCORE", value: 83 }],
            pattern_type: "LOSS_REENTRY"
          }
        ]
      }
    );

    expect(report.patterns[0]).toMatchObject({
      conclusion: "亏损后再次入场的失败行为占主导。",
      counterexamples: [{ status: "PASS", tradeId: "trade-2" }],
      impact: { confidenceScore: 83, effectSize: 0.8, level: "HIGH" },
      limitations: ["当前结论只覆盖已记录交易。", "INCOMPLETE_DATA"],
      relatedTrades: [{ tradeId: "trade-2" }, { tradeId: "trade-1" }],
      sample: { evidenceId: metricId, sampleSize: 12 },
      timeWindow: {
        from: "2026-07-01T00:00:00.000Z",
        to: "2026-07-10T00:00:00.000Z"
      }
    });
  });

  it("marks insufficient samples and preserves an empty evidence window", () => {
    const report = buildEvidenceReport(
      [
        {
          algorithmVersion: "pattern-confidence-v1",
          confidenceScore: 0,
          counterexampleCount: 0,
          dataCompleteness: 1,
          dominantStatus: "UNKNOWN",
          effectSize: 0,
          evidenceId: metricId,
          failCount: 0,
          knownSampleSize: 0,
          level: "INSUFFICIENT",
          passCount: 0,
          patternType: "MOVED_STOP",
          sampleSize: 0,
          unknownCount: 0
        }
      ],
      [],
      {
        explanations: [
          {
            conclusion: "当前没有足够证据形成结论。",
            limitations: [],
            numeric_claims: [{ evidence_id: metricId, metric: "SAMPLE_SIZE", value: 0 }],
            pattern_type: "MOVED_STOP"
          }
        ]
      }
    );
    expect(report.patterns[0]).toMatchObject({
      limitations: ["INSUFFICIENT_SAMPLE"],
      relatedTrades: [],
      timeWindow: null
    });
  });
});
