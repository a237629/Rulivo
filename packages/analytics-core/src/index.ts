export type TradeDirection = "LONG" | "SHORT";
export type ExecutionAction = "BUY" | "SELL";

export interface TradeExecutionInput {
  action: ExecutionAction;
  feesMinor?: readonly bigint[];
  priceMinor: bigint;
  quantity: string;
}

export interface TradeCalculation {
  averageEntryPriceMinor: bigint;
  averageExitPriceMinor: bigint | null;
  closedQuantity: string;
  feesMinor: bigint;
  grossPnlMinor: bigint;
  netPnlMinor: bigint;
  openedQuantity: string;
  remainingQuantity: string;
  status: "OPEN" | "CLOSED";
}

interface Fraction {
  denominator: bigint;
  numerator: bigint;
}

const QUANTITY_SCALE_DIGITS = 10;
const QUANTITY_SCALE = 10n ** BigInt(QUANTITY_SCALE_DIGITS);
const R_SCALE = 1_000_000n;

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

function fraction(numerator: bigint, denominator = 1n): Fraction {
  if (denominator === 0n) throw new RangeError("Fraction denominator cannot be zero");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    denominator: absolute(denominator) / divisor,
    numerator: (numerator / divisor) * sign
  };
}

function add(left: Fraction, right: Fraction): Fraction {
  return fraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator
  );
}

function subtract(left: Fraction, right: Fraction): Fraction {
  return add(left, fraction(-right.numerator, right.denominator));
}

function multiplyByInteger(value: Fraction, multiplier: bigint): Fraction {
  return fraction(value.numerator * multiplier, value.denominator);
}

function divideByInteger(value: Fraction, divisor: bigint): Fraction {
  return fraction(value.numerator, value.denominator * divisor);
}

function roundHalfAwayFromZero(value: Fraction): bigint {
  const quotient = value.numerator / value.denominator;
  const remainder = absolute(value.numerator % value.denominator);
  if (remainder * 2n < value.denominator) return quotient;
  return quotient + (value.numerator < 0n ? -1n : 1n);
}

function parseQuantity(value: string): bigint {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,10}))?$/.exec(value);
  if (match === null) throw new RangeError("Quantity must have at most 10 decimal places");
  const units =
    BigInt(match[1] ?? "0") * QUANTITY_SCALE +
    BigInt((match[2] ?? "").padEnd(QUANTITY_SCALE_DIGITS, "0"));
  if (units <= 0n) throw new RangeError("Quantity must be greater than zero");
  return units;
}

function formatQuantity(units: bigint): string {
  const whole = units / QUANTITY_SCALE;
  const decimals = (units % QUANTITY_SCALE)
    .toString()
    .padStart(QUANTITY_SCALE_DIGITS, "0")
    .replace(/0+$/, "");
  return decimals.length === 0 ? whole.toString() : `${whole.toString()}.${decimals}`;
}

export function calculateTrade(
  direction: TradeDirection,
  executions: readonly TradeExecutionInput[]
): TradeCalculation {
  if (executions.length === 0) throw new RangeError("A trade requires at least one execution");
  const openingAction = direction === "LONG" ? "BUY" : "SELL";
  let position = 0n;
  let openNotional = fraction(0n);
  let openingNotional = fraction(0n);
  let closingNotional = fraction(0n);
  let realizedPnl = fraction(0n);
  let opened = 0n;
  let closed = 0n;
  let fees = 0n;

  for (const execution of executions) {
    if (execution.priceMinor < 0n) throw new RangeError("Price cannot be negative");
    const quantity = parseQuantity(execution.quantity);
    const notional = fraction(execution.priceMinor * quantity);
    for (const fee of execution.feesMinor ?? []) {
      if (fee < 0n) throw new RangeError("Fee cannot be negative");
      fees += fee;
    }
    if (execution.action === openingAction) {
      if (opened > 0n && position === 0n) throw new RangeError("A closed trade cannot reopen");
      position += quantity;
      opened += quantity;
      openNotional = add(openNotional, notional);
      openingNotional = add(openingNotional, notional);
      continue;
    }
    if (position === 0n) throw new RangeError("A trade must open before it can be reduced");
    if (quantity > position) throw new RangeError("An execution cannot reverse a trade");
    const allocatedCost = divideByInteger(multiplyByInteger(openNotional, quantity), position);
    realizedPnl = add(
      realizedPnl,
      direction === "LONG" ? subtract(notional, allocatedCost) : subtract(allocatedCost, notional)
    );
    openNotional = subtract(openNotional, allocatedCost);
    closingNotional = add(closingNotional, notional);
    position -= quantity;
    closed += quantity;
  }

  const grossPnlMinor = roundHalfAwayFromZero(divideByInteger(realizedPnl, QUANTITY_SCALE));
  return {
    averageEntryPriceMinor: roundHalfAwayFromZero(divideByInteger(openingNotional, opened)),
    averageExitPriceMinor:
      closed === 0n ? null : roundHalfAwayFromZero(divideByInteger(closingNotional, closed)),
    closedQuantity: formatQuantity(closed),
    feesMinor: fees,
    grossPnlMinor,
    netPnlMinor: grossPnlMinor - fees,
    openedQuantity: formatQuantity(opened),
    remainingQuantity: formatQuantity(position),
    status: position === 0n ? "CLOSED" : "OPEN"
  };
}

export function calculateRMultiple(pnlMinor: bigint, initialRiskMinor: bigint): string {
  if (initialRiskMinor <= 0n) throw new RangeError("Initial risk must be greater than zero");
  const scaled = roundHalfAwayFromZero(fraction(pnlMinor * R_SCALE, initialRiskMinor));
  const sign = scaled < 0n ? "-" : "";
  const magnitude = absolute(scaled);
  return `${sign}${(magnitude / R_SCALE).toString()}.${(magnitude % R_SCALE)
    .toString()
    .padStart(6, "0")}`;
}

export {
  calculateCoreStatistics,
  type CoreStatistics,
  type PerformanceBucket,
  type StatisticsTrade
} from "./statistics.js";
export {
  evaluateBehaviorRules,
  type BehaviorRuleContext,
  type BehaviorRuleResult,
  type BehaviorRuleType
} from "./behavior-rules.js";
export { calculateResultScore, RESULT_SCORE_VERSION, type ResultScore } from "./result-score.js";
export {
  calculateExecutionScore,
  EXECUTION_SCORE_VERSION,
  type ExecutionDimension,
  type ExecutionDimensionStatus,
  type ExecutionScore,
  type ExecutionScoreInput
} from "./execution-score.js";
export {
  evaluateTradeQuadrant,
  TRADE_QUADRANT_VERSION,
  type DisciplineAxis,
  type ProfitAxis,
  type TradeQuadrant,
  type TradeQuadrantEvaluation
} from "./trade-quadrant.js";
export {
  calculatePatternConfidence,
  PATTERN_CONFIDENCE_MINIMUM_SAMPLE_SIZE,
  PATTERN_CONFIDENCE_TARGET_SAMPLE_SIZE,
  PATTERN_CONFIDENCE_VERSION,
  type PatternConfidence,
  type PatternConfidenceInput,
  type PatternConfidenceLevel,
  type PatternDominantStatus
} from "./pattern-confidence.js";
