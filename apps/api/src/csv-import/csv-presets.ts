import type { CsvMapping, CsvMappingOptions } from "./csv-validation.js";

export const CSV_PRESET_IDS = [
  "BINANCE",
  "OKX",
  "BYBIT",
  "INTERACTIVE_BROKERS",
  "GENERIC"
] as const;

export type CsvPresetId = (typeof CSV_PRESET_IDS)[number];
type MappingField = keyof CsvMapping;

interface CsvPresetDefinition {
  aliases: Record<MappingField, readonly string[]>;
  id: CsvPresetId;
  label: string;
  options: CsvMappingOptions;
}

const defaultOptions: CsvMappingOptions = {
  actionAliases: {},
  defaultCurrency: "USD",
  defaultMarket: "UNKNOWN",
  priceScale: 2
};

export const CSV_PRESETS: readonly CsvPresetDefinition[] = [
  {
    aliases: {
      action: ["Side"],
      currency: ["Fee Coin", "Commission Asset"],
      executedAt: ["Date(UTC)", "Date (UTC)", "Time", "Trade Time"],
      externalId: ["Order No.", "Order ID", "Trade ID"],
      fee: ["Fee", "Commission"],
      market: ["Market"],
      price: ["Price", "Average Price"],
      quantity: ["Executed", "Amount", "Quantity"],
      symbol: ["Pair", "Symbol"]
    },
    id: "BINANCE",
    label: "Binance",
    options: { ...defaultOptions, defaultMarket: "CRYPTO", priceScale: 8 }
  },
  {
    aliases: {
      action: ["Side"],
      currency: ["Fee Currency", "Fee currency"],
      executedAt: ["Filled Time", "Fill Time", "Created Time"],
      externalId: ["Trade ID", "Order ID", "Bill ID"],
      fee: ["Fee"],
      market: ["Market"],
      price: ["Fill Price", "Avg. Price", "Price"],
      quantity: ["Fill Size", "Filled", "Size"],
      symbol: ["Instrument", "InstId", "Symbol"]
    },
    id: "OKX",
    label: "OKX",
    options: { ...defaultOptions, defaultMarket: "CRYPTO", priceScale: 8 }
  },
  {
    aliases: {
      action: ["Side"],
      currency: ["Fee Currency", "Fee Token"],
      executedAt: ["Trade Time", "Exec Time", "Create Time"],
      externalId: ["Exec ID", "Order ID", "Trade ID"],
      fee: ["Trading Fee", "Exec Fee", "Fee"],
      market: ["Market", "Category"],
      price: ["Fill Price", "Exec Price", "Price"],
      quantity: ["Fill Quantity", "Exec Qty", "Qty"],
      symbol: ["Symbol"]
    },
    id: "BYBIT",
    label: "Bybit",
    options: { ...defaultOptions, defaultMarket: "CRYPTO", priceScale: 8 }
  },
  {
    aliases: {
      action: ["Buy/Sell", "Action", "B/S"],
      currency: ["Currency"],
      executedAt: ["Date/Time", "DateTime", "TradeDate"],
      externalId: ["Exec. ID", "Exec ID", "Order ID"],
      fee: ["Comm/Fee", "Commission", "Fee"],
      market: ["Exchange", "Listing Exchange"],
      price: ["T. Price", "TradePrice", "Price"],
      quantity: ["Quantity", "Qty"],
      symbol: ["Symbol"]
    },
    id: "INTERACTIVE_BROKERS",
    label: "Interactive Brokers",
    options: {
      ...defaultOptions,
      actionAliases: { BOT: "BUY", BUY: "BUY", SLD: "SELL", SELL: "SELL" },
      defaultMarket: "UNITED_STATES",
      priceScale: 4
    }
  },
  {
    aliases: {
      action: ["action", "side"],
      currency: ["currency"],
      executedAt: ["executed_at", "executedAt", "timestamp"],
      externalId: ["external_id", "externalId"],
      fee: ["fee"],
      market: ["market"],
      price: ["price"],
      quantity: ["quantity"],
      symbol: ["symbol"]
    },
    id: "GENERIC",
    label: "Generic CSV",
    options: defaultOptions
  }
];

const requiredFields: readonly MappingField[] = [
  "executedAt",
  "symbol",
  "action",
  "quantity",
  "price"
];

function normalizedHeader(header: string): string {
  return header
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[\s_.()/\\-]+/g, "");
}

export function resolveCsvPreset(preset: CsvPresetDefinition, headers: readonly string[]) {
  const available = new Map(headers.map((header) => [normalizedHeader(header), header]));
  const mapping: Partial<CsvMapping> = {};
  for (const [field, aliases] of Object.entries(preset.aliases) as [
    MappingField,
    readonly string[]
  ][]) {
    const matched = aliases
      .map(normalizedHeader)
      .map((alias) => available.get(alias))
      .find(Boolean);
    if (matched !== undefined) mapping[field] = matched;
  }
  const missingFields = requiredFields.filter((field) => mapping[field] === undefined);
  return {
    mapping: missingFields.length === 0 ? (mapping as CsvMapping) : null,
    matchedFields: Object.keys(mapping).length,
    missingFields
  };
}

export function findCsvPreset(id: string): CsvPresetDefinition | undefined {
  return CSV_PRESETS.find((preset) => preset.id === id);
}

export function detectCsvPreset(headers: readonly string[]) {
  return CSV_PRESETS.map((preset) => ({ preset, result: resolveCsvPreset(preset, headers) }))
    .filter(({ result }) => result.mapping !== null)
    .sort((left, right) => right.result.matchedFields - left.result.matchedFields)[0];
}

export function listCsvPresets() {
  return CSV_PRESETS.map((preset) => ({
    aliases: preset.aliases,
    id: preset.id,
    label: preset.label,
    options: preset.options,
    requiredFields
  }));
}
