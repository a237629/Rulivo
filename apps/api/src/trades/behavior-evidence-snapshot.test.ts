import { describe, expect, it } from "vitest";
import { evaluateBehaviorRules } from "@rulivo/analytics-core";
import {
  buildBehaviorEvidenceSnapshots,
  recomputeBehaviorEvidenceSnapshot
} from "./behavior-evidence-snapshot.js";

const context = {
  currentPlaybookId: "playbook-1",
  dailyTradeIds: ["trade-1"],
  evaluatedPlaybookId: "playbook-1",
  lossReentryMinutes: 30,
  maxDailyTrades: 5,
  movedStop: false,
  movedStopEvidenceId: "stop-1",
  openedAt: new Date("2026-07-28T01:00:00.000Z"),
  positionIncreasePercent: 50,
  previousLoss: null,
  priorQuantities: ["1", "1", "1"],
  quantity: "1",
  tradeId: "trade-1"
};

describe("behavior evidence snapshots", () => {
  it("creates one reproducible snapshot for every behavior pattern", () => {
    const results = evaluateBehaviorRules(context);
    const snapshots = buildBehaviorEvidenceSnapshots(context, results);
    expect(snapshots).toHaveLength(5);
    expect(new Set(snapshots.map(({ patternType }) => patternType)).size).toBe(5);
    for (const snapshot of snapshots) {
      expect(recomputeBehaviorEvidenceSnapshot(snapshot.patternType, snapshot.inputData)).toEqual(
        snapshot.outputData
      );
    }
  });

  it("serializes date inputs without losing recomputation semantics", () => {
    const snapshots = buildBehaviorEvidenceSnapshots(context, [
      {
        confidence: "1.000",
        evidenceId: "trade-1",
        evidenceType: "METRIC",
        explanation: "Daily trade count stayed within the configured limit",
        status: "PASS",
        type: "DAILY_TRADE_LIMIT"
      }
    ]);
    const snapshot = snapshots[0];
    expect(snapshot).toBeDefined();
    if (snapshot === undefined) throw new Error("Snapshot was not created");
    expect(snapshot.inputData.openedAt).toBe("2026-07-28T01:00:00.000Z");
    expect(recomputeBehaviorEvidenceSnapshot(snapshot.patternType, snapshot.inputData)).toEqual(
      snapshot.outputData
    );
  });
});
