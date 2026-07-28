import { describe, expect, it } from "vitest";
import { buildExecutionChart } from "./trade-detail-chart.js";

describe("execution detail chart", () => {
  it("returns an explicit empty chart without inventing market prices", () => {
    expect(buildExecutionChart([])).toEqual({
      kind: "EXECUTION_PRICE",
      points: [],
      priceMaxMinor: null,
      priceMinMinor: null
    });
  });

  it("preserves markers and calculates price bounds", () => {
    const chart = buildExecutionChart([
      {
        action: "BUY",
        executedAt: new Date("2026-01-01T00:00:00Z"),
        id: "a",
        priceMinor: 120n,
        quantity: { toFixed: () => "2" }
      },
      {
        action: "SELL",
        executedAt: new Date("2026-01-01T01:00:00Z"),
        id: "b",
        priceMinor: 95n,
        quantity: { toFixed: () => "2" }
      }
    ]);
    expect(chart.priceMinMinor).toBe("95");
    expect(chart.priceMaxMinor).toBe("120");
    expect(chart.points).toHaveLength(2);
  });
});
