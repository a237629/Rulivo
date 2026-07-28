import { z } from "zod";

const columnName = z.string().trim().min(1).max(200);

export const csvMappingSchema = z.object({
  action: columnName,
  currency: columnName.optional(),
  executedAt: columnName,
  externalId: columnName.optional(),
  fee: columnName.optional(),
  market: columnName.optional(),
  price: columnName,
  quantity: columnName,
  symbol: columnName
});

export const csvMappingOptionsSchema = z.object({
  actionAliases: z.record(z.string().trim().min(1), z.enum(["BUY", "SELL"])).default({}),
  defaultCurrency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  defaultMarket: z.string().trim().min(1).max(32).default("UNKNOWN"),
  priceScale: z.number().int().min(0).max(12).default(2)
});

export const uploadCsvSchema = z.object({
  content: z.string().min(1),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/\.csv$/i),
  tradingAccountId: z.uuid()
});

export const applyCsvMappingSchema = z.object({
  mapping: csvMappingSchema,
  options: csvMappingOptionsSchema.default({
    actionAliases: {},
    defaultCurrency: "USD",
    defaultMarket: "UNKNOWN",
    priceScale: 2
  }),
  saveTemplate: z
    .object({
      name: z.string().trim().min(1).max(100)
    })
    .optional()
});

export type CsvMapping = z.infer<typeof csvMappingSchema>;
export type CsvMappingOptions = z.infer<typeof csvMappingOptionsSchema>;

export const applyCsvPresetSchema = z.object({
  presetId: z.enum(["BINANCE", "OKX", "BYBIT", "INTERACTIVE_BROKERS", "GENERIC"])
});

export interface CsvRowError {
  code: string;
  field: string;
  message: string;
}

export interface NormalizedCsvRow {
  action: "BUY" | "SELL";
  currency: string;
  executedAt: string;
  externalId?: string;
  feeMinor: string;
  market: string;
  priceMinor: string;
  quantity: string;
  symbol: string;
}

export const normalizedCsvRowSchema = z.object({
  action: z.enum(["BUY", "SELL"]),
  currency: z.string().regex(/^[A-Z]{3}$/),
  executedAt: z.iso.datetime(),
  externalId: z.string().optional(),
  feeMinor: z.string().regex(/^\d+$/),
  market: z.string().min(1).max(32),
  priceMinor: z.string().regex(/^\d+$/),
  quantity: z.string().regex(/^(0|[1-9]\d*)(?:\.\d{1,10})?$/),
  symbol: z.string().min(1).max(32)
});

function scaledInteger(value: string, scale: number): bigint | null {
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(value.trim());
  if (match === null) return null;
  const decimals = match[2] ?? "";
  if (decimals.length > scale) return null;
  return BigInt(match[1] ?? "0") * 10n ** BigInt(scale) + BigInt(decimals.padEnd(scale, "0"));
}

export function normalizeCsvRow(
  row: Record<string, string>,
  mapping: CsvMapping,
  options: CsvMappingOptions
): { errors: CsvRowError[]; normalized: NormalizedCsvRow | null } {
  const errors: CsvRowError[] = [];
  const value = (field: keyof CsvMapping): string => {
    const column = mapping[field];
    return column === undefined ? "" : (row[column] ?? "").trim();
  };
  if (row.__rowError !== undefined) {
    errors.push({ code: "COLUMN_COUNT", field: "row", message: row.__rowError });
  }

  const executedAtValue = value("executedAt");
  const executedAt = new Date(executedAtValue);
  if (executedAtValue.length === 0 || Number.isNaN(executedAt.valueOf())) {
    errors.push({ code: "INVALID_DATETIME", field: "executedAt", message: "Invalid date/time" });
  }

  const symbol = value("symbol").toUpperCase();
  if (symbol.length === 0 || symbol.length > 32) {
    errors.push({ code: "INVALID_SYMBOL", field: "symbol", message: "Symbol is required" });
  }

  const rawAction = value("action").toUpperCase();
  const actionValue = options.actionAliases[rawAction] ?? rawAction;
  if (actionValue !== "BUY" && actionValue !== "SELL") {
    errors.push({ code: "INVALID_ACTION", field: "action", message: "Action must be BUY or SELL" });
  }

  const quantity = value("quantity");
  if (!/^(0|[1-9]\d*)(?:\.\d{1,10})?$/.test(quantity) || Number(quantity) <= 0) {
    errors.push({
      code: "INVALID_QUANTITY",
      field: "quantity",
      message: "Quantity must be positive with at most 10 decimal places"
    });
  }

  const priceMinor = scaledInteger(value("price"), options.priceScale);
  if (priceMinor === null) {
    errors.push({ code: "INVALID_PRICE", field: "price", message: "Price has invalid precision" });
  }

  const feeValue = value("fee");
  const feeMinor = feeValue.length === 0 ? 0n : scaledInteger(feeValue, options.priceScale);
  if (feeMinor === null) {
    errors.push({ code: "INVALID_FEE", field: "fee", message: "Fee has invalid precision" });
  }

  const currency = (value("currency") || options.defaultCurrency).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    errors.push({
      code: "INVALID_CURRENCY",
      field: "currency",
      message: "Currency must be ISO 4217"
    });
  }
  const market = (value("market") || options.defaultMarket).toUpperCase();
  if (market.length === 0 || market.length > 32) {
    errors.push({ code: "INVALID_MARKET", field: "market", message: "Market is invalid" });
  }

  if (errors.length > 0 || priceMinor === null || feeMinor === null) {
    return { errors, normalized: null };
  }
  const normalized: NormalizedCsvRow = {
    action: actionValue as "BUY" | "SELL",
    currency,
    executedAt: executedAt.toISOString(),
    feeMinor: feeMinor.toString(),
    market,
    priceMinor: priceMinor.toString(),
    quantity,
    symbol
  };
  const externalId = value("externalId");
  if (externalId.length > 0) normalized.externalId = externalId;
  return {
    errors,
    normalized
  };
}
