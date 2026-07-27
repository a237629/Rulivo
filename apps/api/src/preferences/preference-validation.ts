import { z } from "zod";

export const tradingMarkets = [
  "CHINA",
  "HONG_KONG",
  "UNITED_STATES",
  "FOREX",
  "CRYPTO",
  "FUTURES"
] as const;

export const riskUnits = ["PERCENT_OF_EQUITY", "FIXED_AMOUNT", "R_MULTIPLE"] as const;
export const locales = ["zh-CN", "en-US"] as const;

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function isCurrency(value: string): boolean {
  try {
    new Intl.NumberFormat("en-US", { currency: value, style: "currency" }).format(0);
    return true;
  } catch {
    return false;
  }
}

export const preferencesSchema = z
  .object({
    defaultCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .refine(isCurrency, "Unsupported ISO 4217 currency code"),
    defaultMarket: z.enum(tradingMarkets),
    locale: z.enum(locales),
    riskUnit: z.enum(riskUnits),
    timeZone: z.string().min(1).max(64).refine(isTimeZone, "Invalid IANA time zone")
  })
  .strict();

export type PreferenceInput = z.infer<typeof preferencesSchema>;
