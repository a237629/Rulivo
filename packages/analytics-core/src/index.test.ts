import { describe, expect, it } from "vitest";
import { GOLDEN_PNL_CASES } from "./golden-cases.js";
import { calculateRMultiple, calculateTrade } from "./index.js";

describe("P&L golden cases", () => {
  it.each(GOLDEN_PNL_CASES)("$name", ({ direction, executions, expected }) => {
    expect(calculateTrade(direction, executions)).toMatchObject(expected);
  });
});

describe("R multiple", () => {
  it.each([
    [250n, 100n, "2.500000"],
    [-125n, 100n, "-1.250000"],
    [1n, 3n, "0.333333"],
    [-2n, 3n, "-0.666667"]
  ])("calculates %s / %s deterministically", (pnl, risk, expected) => {
    expect(calculateRMultiple(pnl, risk)).toBe(expected);
  });

  it("rejects a missing or non-positive risk", () => {
    expect(() => calculateRMultiple(100n, 0n)).toThrow("greater than zero");
  });
});
