import { describe, expect, it } from "vitest";
import { calculateExecutionScore } from "./execution-score.js";

describe("execution score", () => {
  it("normalizes known dimensions without penalizing UNKNOWN", () => {
    const result = calculateExecutionScore([
      { dimension: "RULES", status: "PASS" },
      { dimension: "POSITION", status: "FAIL" },
      { dimension: "STOP", status: "UNKNOWN" },
      { dimension: "PLAN", status: "PASS" },
      { dimension: "EMOTION", status: "UNKNOWN" }
    ]);
    expect(result.executionScore).toBe(67);
    expect(result.coveragePercent).toBe(60);
    expect(result.dimensions.find(({ dimension }) => dimension === "STOP")?.points).toBeNull();
  });

  it("returns null when every dimension is unknown", () => {
    const result = calculateExecutionScore([]);
    expect(result.executionScore).toBeNull();
    expect(result.coveragePercent).toBe(0);
    expect(result.dimensions).toHaveLength(5);
  });

  it("scores all known passes as 100", () => {
    const result = calculateExecutionScore(
      ["RULES", "POSITION", "STOP", "PLAN", "EMOTION"].map((dimension) => ({
        dimension: dimension as "RULES" | "POSITION" | "STOP" | "PLAN" | "EMOTION",
        status: "PASS" as const
      }))
    );
    expect(result.executionScore).toBe(100);
    expect(result.coveragePercent).toBe(100);
  });
});
