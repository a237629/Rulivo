import { describe, expect, it } from "vitest";
import { tradeListQuery } from "./trade-list";

describe("mobile trade-list query", () => {
  it("serializes active filters and omits empty values", () => {
    const query = tradeListQuery({
      accountId: "",
      dateFrom: "2026-07-01",
      executionScoreMin: 70,
      market: "CRYPTO",
      result: "WIN"
    });
    expect(query).toContain("dateFrom=2026-07-01");
    expect(query).toContain("executionScoreMin=70");
    expect(query).toContain("market=CRYPTO");
    expect(query).toContain("result=WIN");
    expect(query).not.toContain("accountId");
  });
});
