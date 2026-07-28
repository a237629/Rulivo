export interface GroupableExecution {
  action: "BUY" | "SELL";
  currency: string;
  executedAt: string;
  externalId?: string;
  feeMinor: string;
  market: string;
  priceMinor: string;
  quantity: string;
  rowId: string;
  rowNumber: number;
  symbol: string;
}

export interface GroupedExecution {
  action: "BUY" | "SELL";
  executedAt: string;
  externalId?: string;
  feeMinor: bigint;
  priceMinor: bigint;
  quantity: string;
  rowId: string;
}

export interface GroupedTrade {
  currency: string;
  executions: GroupedExecution[];
  market: string;
  side: "LONG" | "SHORT";
  symbol: string;
}

const SCALE_DIGITS = 10;
const SCALE = 10n ** BigInt(SCALE_DIGITS);

function parseQuantity(value: string): bigint {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,10}))?$/.exec(value);
  if (match === null) throw new RangeError(`Invalid quantity: ${value}`);
  const units =
    BigInt(match[1] ?? "0") * SCALE + BigInt((match[2] ?? "").padEnd(SCALE_DIGITS, "0"));
  if (units <= 0n) throw new RangeError("Quantity must be positive");
  return units;
}

function formatQuantity(units: bigint): string {
  const whole = units / SCALE;
  const fraction = (units % SCALE).toString().padStart(SCALE_DIGITS, "0").replace(/0+$/, "");
  return fraction.length === 0 ? whole.toString() : `${whole.toString()}.${fraction}`;
}

function positionDelta(action: "BUY" | "SELL", quantity: bigint): bigint {
  return action === "BUY" ? quantity : -quantity;
}

function allocateFee(totalFee: bigint, allocated: bigint, total: bigint): bigint {
  return (totalFee * allocated) / total;
}

export function groupExecutions(executions: readonly GroupableExecution[]): GroupedTrade[] {
  const sorted = [...executions].sort(
    (left, right) =>
      new Date(left.executedAt).valueOf() - new Date(right.executedAt).valueOf() ||
      left.rowNumber - right.rowNumber
  );
  const active = new Map<string, { position: bigint; trade: GroupedTrade }>();
  const result: GroupedTrade[] = [];

  for (const source of sorted) {
    const key = `${source.market}\u0000${source.symbol}\u0000${source.currency}`;
    let quantity = parseQuantity(source.quantity);
    let feeRemaining = BigInt(source.feeMinor);
    const originalQuantity = quantity;
    let state = active.get(key);

    while (quantity > 0n) {
      if (state === undefined || state.position === 0n) {
        const trade: GroupedTrade = {
          currency: source.currency,
          executions: [],
          market: source.market,
          side: source.action === "BUY" ? "LONG" : "SHORT",
          symbol: source.symbol
        };
        state = { position: 0n, trade };
        active.set(key, state);
        result.push(trade);
      }

      const delta = positionDelta(source.action, quantity);
      const reverses = state.position !== 0n && state.position > 0n !== delta > 0n;
      const allocatedQuantity =
        reverses && quantity > abs(state.position) ? abs(state.position) : quantity;
      const allocatedFee =
        allocatedQuantity === quantity
          ? feeRemaining
          : allocateFee(BigInt(source.feeMinor), allocatedQuantity, originalQuantity);

      state.trade.executions.push({
        action: source.action,
        executedAt: source.executedAt,
        ...(source.externalId === undefined ? {} : { externalId: source.externalId }),
        feeMinor: allocatedFee,
        priceMinor: BigInt(source.priceMinor),
        quantity: formatQuantity(allocatedQuantity),
        rowId: source.rowId
      });
      state.position += positionDelta(source.action, allocatedQuantity);
      quantity -= allocatedQuantity;
      feeRemaining -= allocatedFee;

      if (state.position === 0n) {
        active.delete(key);
        state = undefined;
      }
    }
  }
  return result;
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}
