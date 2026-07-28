export type TradeQuadrant = "EXCELLENT" | "QUALIFIED" | "DANGEROUS" | "ERROR" | "UNKNOWN";
export type ProfitAxis = "PROFIT" | "LOSS" | "UNKNOWN";
export type DisciplineAxis = "FOLLOWED" | "VIOLATED" | "UNKNOWN";

export interface TradeQuadrantEvaluation {
  disciplineAxis: DisciplineAxis;
  profitAxis: ProfitAxis;
  quadrant: TradeQuadrant;
  reason: string;
}

export function evaluateTradeQuadrant(
  realizedPnlMinor: bigint | null,
  ruleStatuses: readonly ("PASS" | "FAIL" | "UNKNOWN")[]
): TradeQuadrantEvaluation {
  const profitAxis: ProfitAxis =
    realizedPnlMinor === null || realizedPnlMinor === 0n
      ? "UNKNOWN"
      : realizedPnlMinor > 0n
        ? "PROFIT"
        : "LOSS";
  const disciplineAxis: DisciplineAxis = ruleStatuses.includes("FAIL")
    ? "VIOLATED"
    : ruleStatuses.length === 5 && ruleStatuses.every((status) => status === "PASS")
      ? "FOLLOWED"
      : "UNKNOWN";

  if (profitAxis === "UNKNOWN") {
    return {
      disciplineAxis,
      profitAxis,
      quadrant: "UNKNOWN",
      reason: "A profitable or losing result is required for quadrant classification"
    };
  }
  if (disciplineAxis === "UNKNOWN") {
    return {
      disciplineAxis,
      profitAxis,
      quadrant: "UNKNOWN",
      reason: "All five rule dimensions require evidence before claiming rule adherence"
    };
  }
  const quadrant =
    profitAxis === "PROFIT"
      ? disciplineAxis === "FOLLOWED"
        ? "EXCELLENT"
        : "DANGEROUS"
      : disciplineAxis === "FOLLOWED"
        ? "QUALIFIED"
        : "ERROR";
  return {
    disciplineAxis,
    profitAxis,
    quadrant,
    reason: `${profitAxis.toLowerCase()} + ${disciplineAxis.toLowerCase()}`
  };
}

export const TRADE_QUADRANT_VERSION = "quadrant-v1";
