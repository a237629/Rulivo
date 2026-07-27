import { describe, expect, it } from "vitest";
import { createI18n, formatCurrencyMinor, formatDateTime, supportedLocales } from "./index.js";
import enUS from "./locales/en-US.json" with { type: "json" };
import zhCN from "./locales/zh-CN.json" with { type: "json" };

function flattenKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    return typeof child === "object" && child !== null
      ? flattenKeys(child as object, path)
      : [path.replace(/_(one|other)$/, "")];
  });
}

describe("translations", () => {
  it("keeps locale resources aligned", async () => {
    const instance = createI18n("zh-CN");
    const chinese = instance.t("preview.noEvidence");

    await instance.changeLanguage("en-US");

    expect(chinese).toBe("暂无证据");
    expect(instance.t("preview.noEvidence")).toBe("No evidence yet");
    expect(instance.languages[0]).toBe("en-US");
  });

  it("supports locale-aware plural forms", () => {
    const instance = createI18n("en-US");
    expect(instance.t("preview.evidenceCount", { count: 1 })).toBe("1 evidence");
    expect(instance.t("preview.evidenceCount", { count: 12 })).toBe("12 evidence");
  });

  it("declares exactly the launch locales", () => {
    expect(supportedLocales).toEqual(["zh-CN", "en-US"]);
  });

  it("keeps translation keys aligned across locales", () => {
    expect([...new Set(flattenKeys(zhCN))].sort()).toEqual([...new Set(flattenKeys(enUS))].sort());
  });
});

describe("regional formatting", () => {
  it("formats integer minor currency units", () => {
    expect(formatCurrencyMinor(123456, "USD", "en-US")).toBe("$1,234.56");
    expect(formatCurrencyMinor(123456, "CNY", "zh-CN")).toContain("1,234.56");
  });

  it("rejects non-integer currency input", () => {
    expect(() => formatCurrencyMinor(12.34, "USD", "en-US")).toThrowError(/integer minor units/);
  });

  it("formats the same instant in the requested time zone", () => {
    const instant = new Date("2026-07-27T00:00:00.000Z");
    const shanghai = formatDateTime(instant, "zh-CN", "Asia/Shanghai");
    const newYork = formatDateTime(instant, "en-US", "America/New_York");

    expect(shanghai).not.toBe(newYork);
    expect(shanghai).toContain("08:00");
  });
});
