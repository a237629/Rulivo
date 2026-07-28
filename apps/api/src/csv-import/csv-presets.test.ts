import { describe, expect, it } from "vitest";
import { CSV_PRESETS, detectCsvPreset, resolveCsvPreset } from "./csv-presets.js";

describe("CSV broker presets", () => {
  it("publishes exactly the five step 13 presets", () => {
    expect(CSV_PRESETS.map(({ id }) => id)).toEqual([
      "BINANCE",
      "OKX",
      "BYBIT",
      "INTERACTIVE_BROKERS",
      "GENERIC"
    ]);
  });

  it.each([
    ["BINANCE", ["Date(UTC)", "Pair", "Side", "Price", "Executed", "Fee", "Fee Coin"]],
    ["OKX", ["Filled Time", "Instrument", "Side", "Fill Price", "Fill Size", "Fee"]],
    ["BYBIT", ["Trade Time", "Symbol", "Side", "Fill Price", "Fill Quantity", "Trading Fee"]],
    [
      "INTERACTIVE_BROKERS",
      ["Date/Time", "Symbol", "Buy/Sell", "T. Price", "Quantity", "Comm/Fee", "Currency"]
    ],
    ["GENERIC", ["executed_at", "symbol", "action", "price", "quantity"]]
  ] as const)("resolves a %s export without positional assumptions", (id, headers) => {
    const preset = CSV_PRESETS.find((candidate) => candidate.id === id);
    if (preset === undefined) throw new Error(`Missing test preset: ${id}`);
    expect(resolveCsvPreset(preset, headers).mapping).not.toBeNull();
  });

  it("detects Bybit from a compatible header set", () => {
    const detected = detectCsvPreset([
      "Exec ID",
      "Trade Time",
      "Symbol",
      "Side",
      "Fill Price",
      "Fill Quantity",
      "Trading Fee"
    ]);
    expect(detected?.preset.id).toBe("BYBIT");
  });

  it("reports missing required fields instead of guessing", () => {
    const binance = CSV_PRESETS[0];
    if (binance === undefined) throw new Error("Missing Binance preset");
    expect(resolveCsvPreset(binance, ["Pair", "Side"]).missingFields).toEqual([
      "executedAt",
      "quantity",
      "price"
    ]);
  });
});
