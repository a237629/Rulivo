import { describe, expect, it } from "vitest";
import { groupExecutions, type GroupableExecution } from "./execution-grouper.js";

function execution(
  overrides: Partial<GroupableExecution> & Pick<GroupableExecution, "action" | "quantity">
): GroupableExecution {
  return {
    currency: "USD",
    executedAt: "2026-01-01T10:00:00.000Z",
    feeMinor: "0",
    market: "NASDAQ",
    priceMinor: "10000",
    rowId: `row-${Math.random().toString(36)}`,
    rowNumber: 2,
    symbol: "AAPL",
    ...overrides
  };
}

describe("deterministic execution grouping", () => {
  it("keeps partial fills and reductions in one trade until flat", () => {
    const grouped = groupExecutions([
      execution({ action: "BUY", quantity: "2", rowNumber: 2 }),
      execution({ action: "BUY", quantity: "3", rowNumber: 3 }),
      execution({ action: "SELL", quantity: "1", rowNumber: 4 }),
      execution({ action: "SELL", quantity: "4", rowNumber: 5 })
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({ side: "LONG" });
    expect(grouped[0]?.executions.map(({ quantity }) => quantity)).toEqual(["2", "3", "1", "4"]);
  });

  it("splits a reversal into closing and new opening executions with exact fee allocation", () => {
    const grouped = groupExecutions([
      execution({ action: "BUY", quantity: "2", rowNumber: 2 }),
      execution({ action: "SELL", feeMinor: "9", quantity: "5", rowNumber: 3 })
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped.map(({ side }) => side)).toEqual(["LONG", "SHORT"]);
    expect(grouped[0]?.executions.at(-1)).toMatchObject({ feeMinor: 3n, quantity: "2" });
    expect(grouped[1]?.executions[0]).toMatchObject({ feeMinor: 6n, quantity: "3" });
  });

  it("keeps a position across UTC dates and separates independent instruments", () => {
    const grouped = groupExecutions([
      execution({
        action: "BUY",
        executedAt: "2026-01-01T23:59:00Z",
        quantity: "1",
        rowNumber: 2
      }),
      execution({
        action: "SELL",
        executedAt: "2026-01-02T00:01:00Z",
        quantity: "1",
        rowNumber: 3
      }),
      execution({ action: "SELL", quantity: "2", rowNumber: 4, symbol: "MSFT" })
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped.find(({ symbol }) => symbol === "AAPL")?.executions).toHaveLength(2);
    expect(grouped.find(({ symbol }) => symbol === "MSFT")?.side).toBe("SHORT");
  });

  it("uses timestamp then source row number for stable ordering", () => {
    const grouped = groupExecutions([
      execution({ action: "SELL", quantity: "1", rowNumber: 3 }),
      execution({ action: "BUY", quantity: "1", rowNumber: 2 })
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.side).toBe("LONG");
  });
});
