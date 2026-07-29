import {
  evaluateBehaviorRules,
  type BehaviorRuleContext,
  type BehaviorRuleResult,
  type BehaviorRuleType
} from "@rulivo/analytics-core";

export interface StoredBehaviorContext {
  currentPlaybookId: string | null;
  dailyTradeIds: string[];
  evaluatedPlaybookId: string;
  lossReentryMinutes: number;
  maxDailyTrades: number;
  movedStop: boolean | null;
  movedStopEvidenceId: string | null;
  openedAt: string;
  positionIncreasePercent: number;
  previousLoss: { closedAt: string; id: string } | null;
  priorQuantities: string[];
  quantity: string;
  tradeId: string;
}

export interface BehaviorEvidenceSnapshotData {
  inputData: StoredBehaviorContext;
  outputData: BehaviorRuleResult;
  patternType: BehaviorRuleType;
}

export function storeBehaviorContext(context: BehaviorRuleContext): StoredBehaviorContext {
  return {
    currentPlaybookId: context.currentPlaybookId,
    dailyTradeIds: [...context.dailyTradeIds],
    evaluatedPlaybookId: context.evaluatedPlaybookId,
    lossReentryMinutes: context.lossReentryMinutes,
    maxDailyTrades: context.maxDailyTrades,
    movedStop: context.movedStop,
    movedStopEvidenceId: context.movedStopEvidenceId ?? null,
    openedAt: new Date(context.openedAt).toISOString(),
    positionIncreasePercent: context.positionIncreasePercent,
    previousLoss:
      context.previousLoss === null
        ? null
        : {
            closedAt: new Date(context.previousLoss.closedAt).toISOString(),
            id: context.previousLoss.id
          },
    priorQuantities: [...context.priorQuantities],
    quantity: context.quantity,
    tradeId: context.tradeId
  };
}

export function buildBehaviorEvidenceSnapshots(
  context: BehaviorRuleContext,
  results: BehaviorRuleResult[]
): BehaviorEvidenceSnapshotData[] {
  const inputData = storeBehaviorContext(context);
  return results.map((result) => ({
    inputData,
    outputData: result,
    patternType: result.type
  }));
}

export function recomputeBehaviorEvidenceSnapshot(
  patternType: BehaviorRuleType,
  inputData: StoredBehaviorContext
): BehaviorRuleResult {
  const result = evaluateBehaviorRules({
    ...inputData,
    movedStopEvidenceId: inputData.movedStopEvidenceId ?? undefined,
    previousLoss: inputData.previousLoss
  }).find(({ type }) => type === patternType);
  if (result === undefined) throw new RangeError("Behavior pattern is not supported");
  return result;
}
