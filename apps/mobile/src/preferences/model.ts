export const supportedPreferenceLocales = ["zh-CN", "en-US"] as const;
export const tradingMarkets = [
  "CHINA",
  "HONG_KONG",
  "UNITED_STATES",
  "FOREX",
  "CRYPTO",
  "FUTURES"
] as const;
export const riskUnits = ["PERCENT_OF_EQUITY", "FIXED_AMOUNT", "R_MULTIPLE"] as const;

export interface UserPreferences {
  defaultCurrency: string;
  defaultMarket: (typeof tradingMarkets)[number];
  locale: (typeof supportedPreferenceLocales)[number];
  riskUnit: (typeof riskUnits)[number];
  timeZone: string;
}

export function detectTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function createDefaultPreferences(): UserPreferences {
  return {
    defaultCurrency: "USD",
    defaultMarket: "UNITED_STATES",
    locale: "zh-CN",
    riskUnit: "PERCENT_OF_EQUITY",
    timeZone: detectTimeZone()
  };
}

export function validatePreferences(value: UserPreferences): readonly string[] {
  const errors: string[] = [];
  if (!/^[A-Z]{3}$/.test(value.defaultCurrency)) errors.push("defaultCurrency");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value.timeZone }).format();
  } catch {
    errors.push("timeZone");
  }
  return errors;
}
