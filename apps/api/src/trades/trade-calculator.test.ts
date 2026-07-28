import { describe, expect, it } from "vitest";
import { calculateTrade } from "./trade-calculator.js";

describe("trade calculator", () => {
  it("calculates fees and a partial long reduction after multiple entries", () => {
    const result = calculateTrade("LONG", [
      { action: "BUY", feesMinor: [100n], priceMinor: 10_000n, quantity: "10" },
      { action: "BUY", feesMinor: [50n], priceMinor: 11_000n, quantity: "5" },
      { action: "SELL", feesMinor: [80n], priceMinor: 12_000n, quantity: "8" }
    ]);

    expect(result).toEqual({
      averageEntryPriceMinor: 10_333n,
      averageExitPriceMinor: 12_000n,
      closedQuantity: "8",
      feesMinor: 230n,
      grossPnlMinor: 13_333n,
      netPnlMinor: 13_103n,
      openedQuantity: "15",
      remainingQuantity: "7",
      status: "OPEN"
    });
  });

  it("supports multiple short entries and partial covers", () => {
    const result = calculateTrade("SHORT", [
      { action: "SELL", feesMinor: [10n], priceMinor: 2_500n, quantity: "4" },
      { action: "SELL", feesMinor: [10n], priceMinor: 2_400n, quantity: "6" },
      { action: "BUY", feesMinor: [10n], priceMinor: 2_200n, quantity: "5" }
    ]);

    expect(result).toMatchObject({
      averageEntryPriceMinor: 2_440n,
      averageExitPriceMinor: 2_200n,
      closedQuantity: "5",
      feesMinor: 30n,
      grossPnlMinor: 1_200n,
      netPnlMinor: 1_170n,
      openedQuantity: "10",
      remainingQuantity: "5",
      status: "OPEN"
    });
  });

  it("subtracts all fees from a fully closed trade", () => {
    const result = calculateTrade("LONG", [
      { action: "BUY", feesMinor: [25n], priceMinor: 1_000n, quantity: "2" },
      { action: "SELL", feesMinor: [15n], priceMinor: 1_100n, quantity: "2" }
    ]);

    expect(result.grossPnlMinor).toBe(200n);
    expect(result.feesMinor).toBe(40n);
    expect(result.netPnlMinor).toBe(160n);
    expect(result.remainingQuantity).toBe("0");
    expect(result.status).toBe("CLOSED");
  });

  it("rejects a reduction that would reverse the declared direction", () => {
    expect(() =>
      calculateTrade("LONG", [
        { action: "BUY", priceMinor: 1_000n, quantity: "1" },
        { action: "SELL", priceMinor: 1_100n, quantity: "1.1" }
      ])
    ).toThrow("reverse");
  });
});
