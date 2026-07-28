import { describe, expect, it } from "vitest";
import { normalizeCsvRow } from "./csv-validation.js";

const mapping = {
  action: "Side",
  executedAt: "Time",
  fee: "Commission",
  price: "Price",
  quantity: "Qty",
  symbol: "Ticker"
} as const;
const options = {
  actionAliases: {},
  defaultCurrency: "USD",
  defaultMarket: "NASDAQ",
  priceScale: 2
};

describe("CSV row normalization", () => {
  it("normalizes a valid mapped execution without floating-point money", () => {
    expect(
      normalizeCsvRow(
        {
          Commission: "1.25",
          Price: "187.50",
          Qty: "0.5",
          Side: "buy",
          Ticker: "aapl",
          Time: "2026-01-05T14:30:00Z"
        },
        mapping,
        options
      )
    ).toEqual({
      errors: [],
      normalized: {
        action: "BUY",
        currency: "USD",
        executedAt: "2026-01-05T14:30:00.000Z",
        feeMinor: "125",
        market: "NASDAQ",
        priceMinor: "18750",
        quantity: "0.5",
        symbol: "AAPL"
      }
    });
  });

  it("returns field-level errors for an invalid row", () => {
    const result = normalizeCsvRow(
      {
        Commission: "-1",
        Price: "10.999",
        Qty: "0",
        Side: "hold",
        Ticker: "",
        Time: "not-a-date"
      },
      mapping,
      options
    );

    expect(result.normalized).toBeNull();
    expect(result.errors.map((error) => error.code)).toEqual([
      "INVALID_DATETIME",
      "INVALID_SYMBOL",
      "INVALID_ACTION",
      "INVALID_QUANTITY",
      "INVALID_PRICE",
      "INVALID_FEE"
    ]);
  });

  it("normalizes broker-specific action aliases", () => {
    const result = normalizeCsvRow(
      {
        Price: "10.25",
        Qty: "2",
        Side: "BOT",
        Ticker: "AAPL",
        Time: "2026-01-05T14:30:00Z"
      },
      mapping,
      { ...options, actionAliases: { BOT: "BUY", SLD: "SELL" } }
    );

    expect(result.normalized?.action).toBe("BUY");
  });
});
