export type BehaviorRuleType =
  "LOSS_REENTRY" | "POSITION_INCREASE" | "MOVED_STOP" | "DAILY_TRADE_LIMIT" | "PLAN_DEVIATION";

export interface BehaviorRuleContext {
  currentPlaybookId: string | null;
  dailyTradeIds: readonly string[];
  evaluatedPlaybookId: string;
  lossReentryMinutes: number;
  maxDailyTrades: number;
  movedStop: boolean | null;
  movedStopEvidenceId?: string | undefined;
  positionIncreasePercent: number;
  previousLoss: { closedAt: Date | string; id: string } | null;
  priorQuantities: readonly string[];
  quantity: string;
  tradeId: string;
  openedAt: Date | string;
}

export interface BehaviorRuleResult {
  confidence: "0.000" | "1.000";
  evidenceId: string | null;
  evidenceType: "TRADE" | "METRIC" | "MISSING_DATA";
  explanation: string;
  status: "PASS" | "FAIL" | "UNKNOWN";
  type: BehaviorRuleType;
}

const SCALE = 10_000_000_000n;

function quantityUnits(value: string): bigint {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,10}))?$/.exec(value);
  if (match === null) throw new RangeError("Invalid position quantity");
  return BigInt(match[1] ?? "0") * SCALE + BigInt((match[2] ?? "").padEnd(10, "0"));
}

function result(
  type: BehaviorRuleType,
  status: BehaviorRuleResult["status"],
  evidenceType: BehaviorRuleResult["evidenceType"],
  evidenceId: string | null,
  explanation: string
): BehaviorRuleResult {
  return {
    confidence: status === "UNKNOWN" ? "0.000" : "1.000",
    evidenceId,
    evidenceType,
    explanation,
    status,
    type
  };
}

export function evaluateBehaviorRules(context: BehaviorRuleContext): BehaviorRuleResult[] {
  const previousLossResult =
    context.previousLoss === null
      ? result(
          "LOSS_REENTRY",
          "PASS",
          "TRADE",
          context.tradeId,
          "No preceding losing trade was found"
        )
      : (() => {
          const interval =
            new Date(context.openedAt).valueOf() -
            new Date(context.previousLoss.closedAt).valueOf();
          const fails = interval >= 0 && interval < context.lossReentryMinutes * 60_000;
          return result(
            "LOSS_REENTRY",
            fails ? "FAIL" : "PASS",
            "TRADE",
            context.previousLoss.id,
            fails
              ? "Trade reopened inside the configured post-loss cooldown"
              : "Trade respected the configured post-loss cooldown"
          );
        })();

  const sortedQuantities = context.priorQuantities
    .map(quantityUnits)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const positionResult =
    sortedQuantities.length < 3
      ? result(
          "POSITION_INCREASE",
          "UNKNOWN",
          "MISSING_DATA",
          null,
          "At least three prior positions are required"
        )
      : (() => {
          const median = sortedQuantities[Math.floor(sortedQuantities.length / 2)];
          if (median === undefined || median === 0n) {
            return result(
              "POSITION_INCREASE",
              "UNKNOWN",
              "MISSING_DATA",
              null,
              "Prior position baseline is unavailable"
            );
          }
          const fails =
            quantityUnits(context.quantity) * 100n >
            median * BigInt(100 + context.positionIncreasePercent);
          return result(
            "POSITION_INCREASE",
            fails ? "FAIL" : "PASS",
            "METRIC",
            context.tradeId,
            fails
              ? "Position exceeded the configured median increase threshold"
              : "Position stayed within the configured median increase threshold"
          );
        })();

  const movedStopResult =
    context.movedStop === null
      ? result(
          "MOVED_STOP",
          "UNKNOWN",
          "MISSING_DATA",
          null,
          "Stop movement history is unavailable"
        )
      : result(
          "MOVED_STOP",
          context.movedStop ? "FAIL" : "PASS",
          "TRADE",
          context.movedStopEvidenceId ?? context.tradeId,
          context.movedStop ? "Stop was moved" : "No stop movement was detected"
        );
  const dailyFails = context.dailyTradeIds.length > context.maxDailyTrades;
  const dailyResult = result(
    "DAILY_TRADE_LIMIT",
    dailyFails ? "FAIL" : "PASS",
    "METRIC",
    context.tradeId,
    dailyFails
      ? "Daily trade count exceeded the configured limit"
      : "Daily trade count stayed within the configured limit"
  );
  const planResult =
    context.currentPlaybookId === null
      ? result(
          "PLAN_DEVIATION",
          "UNKNOWN",
          "MISSING_DATA",
          null,
          "No playbook was assigned when the trade was recorded"
        )
      : result(
          "PLAN_DEVIATION",
          context.currentPlaybookId === context.evaluatedPlaybookId ? "PASS" : "FAIL",
          "TRADE",
          context.tradeId,
          context.currentPlaybookId === context.evaluatedPlaybookId
            ? "Trade matched its assigned playbook"
            : "Trade used a different playbook"
        );

  return [previousLossResult, positionResult, movedStopResult, dailyResult, planResult];
}
