import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "./locales/en-US.json" with { type: "json" };
import zhCN from "./locales/zh-CN.json" with { type: "json" };

export const supportedLocales = ["zh-CN", "en-US"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export const DEFAULT_LOCALE: SupportedLocale = "zh-CN";

const resources = {
  "en-US": { translation: enUS },
  "zh-CN": { translation: zhCN }
} as const;

export function createI18n(initialLocale: SupportedLocale = DEFAULT_LOCALE): I18nInstance {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    fallbackLng: DEFAULT_LOCALE,
    initImmediate: false,
    interpolation: {
      escapeValue: false
    },
    lng: initialLocale,
    resources,
    supportedLngs: supportedLocales
  });
  return instance;
}

export const i18n = createI18n();

function assertSafeIntegerMinorUnits(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError("Currency amounts must use safe integer minor units");
  }
}

export function formatCurrencyMinor(
  amountMinor: number,
  currency: string,
  locale: SupportedLocale
): string {
  assertSafeIntegerMinorUnits(amountMinor);
  const formatter = new Intl.NumberFormat(locale, {
    currency,
    style: "currency"
  });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** fractionDigits);
}

export function formatDateTime(
  value: Date | number,
  locale: SupportedLocale,
  timeZone: string
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone
  }).format(value);
}
