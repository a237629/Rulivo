import { describe, expect, it } from "vitest";
import { CsvParseError, parseCsv } from "./csv-parser.js";

describe("CSV parser", () => {
  it("parses BOM, quoted commas, escaped quotes and quoted newlines", () => {
    const parsed = parseCsv(
      '\uFEFFsymbol,note,quantity\r\nAAPL,"partial, fill",1\r\nMSFT,"said ""go""\nnext",2'
    );

    expect(parsed.headers).toEqual(["symbol", "note", "quantity"]);
    expect(parsed.rows).toEqual([
      { note: "partial, fill", quantity: "1", symbol: "AAPL" },
      { note: 'said "go"\nnext', quantity: "2", symbol: "MSFT" }
    ]);
  });

  it("preserves a structural row error for preview and mapping", () => {
    expect(parseCsv("symbol,quantity\nAAPL").rows[0]).toMatchObject({
      __rowError: "Expected 2 columns, received 1",
      quantity: "",
      symbol: "AAPL"
    });
  });

  it("rejects duplicate headers and unterminated quotes", () => {
    expect(() => parseCsv("symbol,symbol\nAAPL,AAPL")).toThrow(CsvParseError);
    expect(() => parseCsv('symbol,note\nAAPL,"broken')).toThrow("unterminated");
  });
});
