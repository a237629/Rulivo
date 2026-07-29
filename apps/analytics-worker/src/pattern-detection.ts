export const PATTERN_DETECTION_ALGORITHM_VERSION = "behavior-rules-v1";

export type PatternDetectionMode = "DAILY_INCREMENTAL" | "WEEKLY_FULL";

export interface PatternDetectionStore {
  completeRun(input: {
    errorMessage: string | null;
    failedTrades: number;
    processedTrades: number;
    runId: string;
    status: "FAILED" | "SUCCEEDED";
  }): Promise<void>;
  createRun(input: {
    algorithmVersion: string;
    cutoffAt: Date;
    mode: PatternDetectionMode;
  }): Promise<string>;
  evaluateTrade(tradeId: string, algorithmVersion: string): Promise<void>;
  recalculateConfidence(runId: string): Promise<void>;
  selectTradeIds(mode: PatternDetectionMode, cutoffAt: Date): Promise<string[]>;
}

export function parsePatternDetectionMode(value: string | undefined): PatternDetectionMode {
  if (value === "daily") return "DAILY_INCREMENTAL";
  if (value === "weekly") return "WEEKLY_FULL";
  throw new Error("Pattern detection mode must be daily or weekly");
}

export async function runPatternDetection(
  store: PatternDetectionStore,
  mode: PatternDetectionMode,
  cutoffAt = new Date()
) {
  const runId = await store.createRun({
    algorithmVersion: PATTERN_DETECTION_ALGORITHM_VERSION,
    cutoffAt,
    mode
  });
  let failedTrades = 0;
  let processedTrades = 0;
  try {
    const tradeIds = await store.selectTradeIds(mode, cutoffAt);
    for (const tradeId of tradeIds) {
      try {
        await store.evaluateTrade(tradeId, PATTERN_DETECTION_ALGORITHM_VERSION);
        processedTrades += 1;
      } catch {
        failedTrades += 1;
      }
    }
    await store.recalculateConfidence(runId);
    const status = failedTrades === 0 ? "SUCCEEDED" : "FAILED";
    await store.completeRun({
      errorMessage: failedTrades === 0 ? null : `${String(failedTrades)} trade evaluations failed`,
      failedTrades,
      processedTrades,
      runId,
      status
    });
    return { failedTrades, mode, processedTrades, runId, status };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Pattern detection failed";
    await store.completeRun({
      errorMessage,
      failedTrades,
      processedTrades,
      runId,
      status: "FAILED"
    });
    throw error;
  }
}
