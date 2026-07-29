export interface EvidenceReportTrade {
  evidenceId: string;
  openedAt: string;
  status: "FAIL" | "PASS" | "UNKNOWN";
  symbol: string;
  tradeId: string;
}

export interface EvidenceReportPattern {
  conclusion: string;
  counterexamples: EvidenceReportTrade[];
  impact: {
    confidenceScore: number;
    dataCompleteness: number;
    dominantStatus: "BALANCED" | "FAIL" | "PASS" | "UNKNOWN";
    effectSize: number;
    level: "HIGH" | "INSUFFICIENT" | "LOW" | "MEDIUM";
  };
  limitations: string[];
  numericClaims: {
    evidence_id: string;
    metric: string;
    value: number;
  }[];
  patternType: string;
  relatedTrades: EvidenceReportTrade[];
  sample: {
    counterexampleCount: number;
    evidenceId: string;
    failCount: number;
    knownSampleSize: number;
    passCount: number;
    sampleSize: number;
    unknownCount: number;
  };
  timeWindow: null | { from: string; to: string };
}

export interface EvidenceReport {
  explanationId: string;
  generatedFrom: string;
  patterns: EvidenceReportPattern[];
}

export type PatternExplanationFeedbackReason =
  "EVIDENCE_ERROR" | "INACCURATE" | "TONE_INAPPROPRIATE" | "UNHELPFUL";

export async function submitPatternExplanationFeedback(
  explanationId: string,
  patternType: string,
  reason: PatternExplanationFeedbackReason,
  accessToken: string,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"
): Promise<{ id: string }> {
  const response = await fetch(
    `${apiBaseUrl}/analytics/pattern-explanations/${explanationId}/feedback`,
    {
      body: JSON.stringify({ patternType, reason }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    }
  );
  if (!response.ok) throw new Error(`Explanation feedback failed (${String(response.status)})`);
  const payload = (await response.json()) as { data?: { id: string } };
  if (!payload.data?.id) throw new Error("Explanation feedback response is invalid");
  return payload.data;
}

export async function fetchEvidenceReport(
  accessToken: string,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"
): Promise<EvidenceReport> {
  const response = await fetch(`${apiBaseUrl}/analytics/evidence-report`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(`Evidence report failed (${String(response.status)})`);
  const payload = (await response.json()) as { data?: EvidenceReport };
  if (!payload.data || !Array.isArray(payload.data.patterns)) {
    throw new Error("Evidence report response is invalid");
  }
  return payload.data;
}
