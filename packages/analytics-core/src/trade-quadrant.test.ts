import { describe, expect, it } from "vitest";
import { evaluateTradeQuadrant } from "./trade-quadrant.js";

const followed = ["PASS", "PASS", "PASS", "PASS", "PASS"] as const;

describe("trade quadrant", () => {
  it.each([
    [100n, followed, "EXCELLENT"],
    [-100n, followed, "QUALIFIED"],
    [100n, ["PASS", "FAIL", "UNKNOWN"], "DANGEROUS"],
    [-100n, ["FAIL"], "ERROR"]
  ] as const)("classifies pnl=%s as %s", (pnl, statuses, expected) => {
    expect(evaluateTradeQuadrant(pnl, statuses).quadrant).toBe(expected);
  });

  it("does not claim compliance when evidence is unknown", () => {
    const evaluation = evaluateTradeQuadrant(100n, ["PASS", "PASS", "UNKNOWN"]);
    expect(evaluation.quadrant).toBe("UNKNOWN");
    expect(evaluation.disciplineAxis).toBe("UNKNOWN");
  });

  it("does not force breakeven into profit or loss", () => {
    expect(evaluateTradeQuadrant(0n, followed).quadrant).toBe("UNKNOWN");
  });
});
