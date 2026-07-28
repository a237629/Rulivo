import { describe, expect, it } from "vitest";
import { calculateResultScore } from "./result-score.js";

describe("result score", () => {
  it.each([
    ["1.000000", "2.000000", 100n, [50, 15, 20, 85]],
    ["2.000000", "2.000000", 100n, [50, 30, 20, 100]],
    ["0.000000", "2.000000", 0n, [25, 0, 10, 35]],
    ["-1.000000", "2.000000", -100n, [0, 0, 0, 0]]
  ])("scores R=%s against target=%s", (rMultiple, target, pnl, expected) => {
    const score = calculateResultScore(rMultiple, target, pnl);
    expect([
      score.riskAdjustedComponent,
      score.targetAchievementComponent,
      score.outcomeComponent,
      score.resultScore
    ]).toEqual(expected);
  });

  it("rejects a non-positive plan target", () => {
    expect(() => calculateResultScore("1.000000", "0.000000", 100n)).toThrow(
      "must be greater than zero"
    );
  });
});
