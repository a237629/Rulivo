import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { parseTradeListQuery } from "./trade-list.query.js";

describe("trade-list filters", () => {
  it("parses every documented filter and pagination input", () => {
    expect(
      parseTradeListQuery({
        accountId: "c985f008-a79d-4a60-b542-2914857afc4b",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
        executionScoreMax: "90",
        executionScoreMin: "60",
        limit: "25",
        market: "CRYPTO",
        result: "WIN",
        strategyId: "6525477d-a34a-4e60-ad46-bdd889bca28e"
      })
    ).toMatchObject({
      executionScoreMax: 90,
      executionScoreMin: 60,
      limit: 25,
      result: "WIN"
    });
  });

  it("rejects inverted date and score ranges", () => {
    expect(() => parseTradeListQuery({ dateFrom: "2026-08-01", dateTo: "2026-07-01" })).toThrow(
      BadRequestException
    );
    expect(() => parseTradeListQuery({ executionScoreMax: "20", executionScoreMin: "80" })).toThrow(
      BadRequestException
    );
  });

  it("defaults to a bounded first page", () => {
    expect(parseTradeListQuery({})).toEqual({ limit: 20 });
  });
});
