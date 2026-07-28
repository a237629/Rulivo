import { describe, expect, it } from "vitest";
import { buildReviewSummary } from "./review-summary.js";

describe("structured review summary", () => {
  it("cites execution, rule and user voice evidence", () => {
    const summary = buildReviewSummary({
      executions: [
        {
          action: "BUY",
          executedAt: new Date("2026-07-28T01:00:00Z"),
          id: "execution-1",
          priceMinor: 100n,
          quantity: { toFixed: () => "2" }
        }
      ],
      ruleResults: [
        {
          explanation: "Stop was not moved",
          id: "rule-1",
          playbookRule: { type: "MOVED_STOP" },
          status: "PASS"
        }
      ],
      side: "LONG",
      symbol: "AAPL",
      voiceRecordings: [
        {
          transcription: {
            candidateText: "candidate",
            confirmedText: "confirmed",
            id: "transcription-1",
            insightExtraction: { extractedData: { evidenceQuotes: ["I followed the plan"] } }
          }
        }
      ]
    });

    expect(summary.overview).toContain("AAPL LONG");
    expect(summary.execution.evidenceIds).toEqual(["execution-1"]);
    expect(summary.rules.evidenceIds).toEqual(["rule-1"]);
    expect(summary.voice.evidenceIds).toHaveLength(1);
    expect(summary.evidence.map(({ kind }) => kind)).toEqual(["EXECUTION", "RULE", "VOICE"]);
  });

  it("states evidence absence instead of inventing conclusions", () => {
    const summary = buildReviewSummary({
      executions: [],
      ruleResults: [],
      side: "SHORT",
      symbol: "BTCUSD",
      voiceRecordings: []
    });
    expect(summary.execution.text).toContain("No execution evidence");
    expect(summary.voice.text).toContain("No confirmed user voice evidence");
    expect(summary.evidence).toEqual([]);
  });
});
