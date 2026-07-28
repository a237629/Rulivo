import type { TradeDirection, TradeExecutionInput } from "./index.js";

export interface GoldenPnlCase {
  direction: TradeDirection;
  executions: TradeExecutionInput[];
  expected: {
    grossPnlMinor: bigint;
    netPnlMinor: bigint;
    remainingQuantity: string;
  };
  name: string;
}

export const GOLDEN_PNL_CASES: readonly GoldenPnlCase[] = [
  {
    direction: "LONG",
    executions: [
      { action: "BUY", feesMinor: [100n], priceMinor: 10_000n, quantity: "10" },
      { action: "BUY", feesMinor: [50n], priceMinor: 11_000n, quantity: "5" },
      { action: "SELL", feesMinor: [80n], priceMinor: 12_000n, quantity: "8" }
    ],
    expected: { grossPnlMinor: 13_333n, netPnlMinor: 13_103n, remainingQuantity: "7" },
    name: "partial long with weighted average cost"
  },
  {
    direction: "SHORT",
    executions: [
      { action: "SELL", feesMinor: [10n], priceMinor: 2_500n, quantity: "4" },
      { action: "SELL", feesMinor: [10n], priceMinor: 2_400n, quantity: "6" },
      { action: "BUY", feesMinor: [10n], priceMinor: 2_200n, quantity: "10" }
    ],
    expected: { grossPnlMinor: 2_400n, netPnlMinor: 2_370n, remainingQuantity: "0" },
    name: "fully closed short after multiple fills"
  },
  {
    direction: "LONG",
    executions: [
      { action: "BUY", priceMinor: 101n, quantity: "0.3333333333" },
      { action: "SELL", priceMinor: 104n, quantity: "0.3333333333" }
    ],
    expected: { grossPnlMinor: 1n, netPnlMinor: 1n, remainingQuantity: "0" },
    name: "fractional quantity rounds half away from zero"
  }
];
