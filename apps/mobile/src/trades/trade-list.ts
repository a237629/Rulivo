export type TradeResult = "WIN" | "LOSS" | "BREAKEVEN" | "UNKNOWN";

export interface TradeListFilters {
  accountId?: string;
  cursor?: string;
  dateFrom?: string;
  dateTo?: string;
  executionScoreMax?: number;
  executionScoreMin?: number;
  market?: string;
  result?: TradeResult;
  strategyId?: string;
}

export interface TradeListItem {
  closedAt: string | null;
  currency: string;
  executionScore: number | null;
  id: string;
  market: string | null;
  openedAt: string;
  playbook: { id: string; name: string } | null;
  realizedPnlMinor: string | null;
  result: TradeResult;
  side: "LONG" | "SHORT";
  status: string;
  symbol: string;
  tradingAccount: { id: string; name: string };
}

export function tradeListQuery(filters: TradeListFilters): string {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") parameters.set(key, String(value));
  }
  const query = parameters.toString();
  return query.length === 0 ? "" : `?${query}`;
}

export async function fetchTrades(
  filters: TradeListFilters,
  accessToken: string,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"
): Promise<{ items: TradeListItem[]; nextCursor: string | null }> {
  const response = await fetch(`${apiBaseUrl}/trades${tradeListQuery(filters)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(`Trade list failed (${String(response.status)})`);
  const payload = (await response.json()) as {
    data?: { items: TradeListItem[]; nextCursor: string | null };
  };
  if (!payload.data) throw new Error("Trade list response is invalid");
  return payload.data;
}
