import { describe, expect, it } from "vitest";
import {
  calculatePatternConfidence,
  PATTERN_CONFIDENCE_MINIMUM_SAMPLE_SIZE
} from "./pattern-confidence.js";

describe("pattern confidence", () => {
  it("enforces the sample threshold even for a perfectly consistent small sample", () => {
    expect(
      calculatePatternConfidence({
        failCount: PATTERN_CONFIDENCE_MINIMUM_SAMPLE_SIZE - 1,
        passCount: 0,
        unknownCount: 0
      })
    ).toMatchObject({ confidenceScore: 0, level: "INSUFFICIENT", sampleSize: 9 });
  });

  it("quantifies effect, counterexamples, and completeness independently", () => {
    expect(calculatePatternConfidence({ failCount: 18, passCount: 2, unknownCount: 5 })).toEqual({
      confidenceScore: 83,
      counterexampleCount: 2,
      dataCompleteness: 0.8,
      dominantStatus: "FAIL",
      effectSize: 0.8,
      failCount: 18,
      knownSampleSize: 20,
      level: "HIGH",
      passCount: 2,
      sampleSize: 25,
      unknownCount: 5
    });
  });

  it("preserves the effect direction and handles an empty sample", () => {
    expect(
      calculatePatternConfidence({ failCount: 2, passCount: 8, unknownCount: 0 })
    ).toMatchObject({
      counterexampleCount: 2,
      dominantStatus: "PASS",
      effectSize: -0.6
    });
    expect(
      calculatePatternConfidence({ failCount: 0, passCount: 0, unknownCount: 0 })
    ).toMatchObject({
      dataCompleteness: 0,
      dominantStatus: "UNKNOWN",
      effectSize: 0,
      level: "INSUFFICIENT"
    });
  });

  it("rejects invalid aggregate counts", () => {
    expect(() =>
      calculatePatternConfidence({ failCount: -1, passCount: 0, unknownCount: 0 })
    ).toThrow(/failCount/);
  });
});
