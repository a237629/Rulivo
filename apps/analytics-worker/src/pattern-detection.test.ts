import { describe, expect, it, vi } from "vitest";
import {
  parsePatternDetectionMode,
  PATTERN_DETECTION_ALGORITHM_VERSION,
  runPatternDetection,
  type PatternDetectionStore
} from "./pattern-detection.js";

function store(tradeIds: string[]) {
  const completeRun = vi.fn().mockResolvedValue(undefined);
  const createRun = vi.fn().mockResolvedValue("run-1");
  const evaluateTrade = vi.fn().mockResolvedValue(undefined);
  const recalculateConfidence = vi.fn().mockResolvedValue(undefined);
  const selectTradeIds = vi.fn().mockResolvedValue(tradeIds);
  const repository: PatternDetectionStore = {
    completeRun,
    createRun,
    evaluateTrade,
    recalculateConfidence,
    selectTradeIds
  };
  return {
    completeRun,
    createRun,
    evaluateTrade,
    recalculateConfidence,
    repository,
    selectTradeIds
  };
}

describe("pattern detection job", () => {
  it("maps explicit daily and weekly commands", () => {
    expect(parsePatternDetectionMode("daily")).toBe("DAILY_INCREMENTAL");
    expect(parsePatternDetectionMode("weekly")).toBe("WEEKLY_FULL");
    expect(() => parsePatternDetectionMode("hourly")).toThrow(/daily or weekly/);
  });

  it("records the algorithm version and completes an incremental run", async () => {
    const { createRun, evaluateTrade, recalculateConfidence, repository } = store([
      "trade-1",
      "trade-2"
    ]);
    await expect(
      runPatternDetection(repository, "DAILY_INCREMENTAL", new Date("2026-07-29T00:00:00Z"))
    ).resolves.toMatchObject({
      failedTrades: 0,
      processedTrades: 2,
      status: "SUCCEEDED"
    });
    expect(createRun).toHaveBeenCalledWith(
      expect.objectContaining({ algorithmVersion: PATTERN_DETECTION_ALGORITHM_VERSION })
    );
    expect(evaluateTrade).toHaveBeenCalledTimes(2);
    expect(recalculateConfidence).toHaveBeenCalledWith("run-1");
  });

  it("finishes the batch and reports per-trade failures", async () => {
    const { evaluateTrade, repository } = store(["trade-1", "trade-2"]);
    evaluateTrade.mockRejectedValueOnce(new Error("bad trade")).mockResolvedValueOnce(undefined);
    await expect(runPatternDetection(repository, "WEEKLY_FULL")).resolves.toMatchObject({
      failedTrades: 1,
      processedTrades: 1,
      status: "FAILED"
    });
  });
});
