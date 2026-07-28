import { describe, expect, it } from "vitest";
import { createDefaultPreferences, validatePreferences } from "./model";

describe("onboarding preferences", () => {
  it("uses a valid detected time zone and complete defaults", () => {
    const preferences = createDefaultPreferences();
    expect(validatePreferences(preferences)).toEqual([]);
    expect(preferences).toMatchObject({
      defaultCurrency: "USD",
      defaultMarket: "UNITED_STATES",
      locale: "zh-CN",
      riskUnit: "PERCENT_OF_EQUITY"
    });
  });

  it("rejects invalid currency and time-zone input", () => {
    expect(
      validatePreferences({
        ...createDefaultPreferences(),
        defaultCurrency: "usd",
        timeZone: "not/a-zone"
      })
    ).toEqual(["defaultCurrency", "timeZone"]);
  });
});
