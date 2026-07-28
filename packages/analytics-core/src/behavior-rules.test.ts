import { describe, expect, it } from "vitest";
import { evaluateBehaviorRules, type BehaviorRuleContext } from "./behavior-rules.js";

const base: BehaviorRuleContext = {
  currentPlaybookId: "playbook-1",
  dailyTradeIds: ["1", "2"],
  evaluatedPlaybookId: "playbook-1",
  lossReentryMinutes: 30,
  maxDailyTrades: 5,
  movedStop: null,
  openedAt: "2026-01-01T10:20:00Z",
  positionIncreasePercent: 50,
  previousLoss: { closedAt: "2026-01-01T10:00:00Z", id: "loss-1" },
  priorQuantities: ["1", "1.2", "0.8"],
  quantity: "1",
  tradeId: "trade-1"
};

describe("behavior rule engine", () => {
  it("fails a rapid post-loss reentry with the losing trade as evidence", () => {
    expect(evaluateBehaviorRules(base)[0]).toMatchObject({
      evidenceId: "loss-1",
      status: "FAIL",
      type: "LOSS_REENTRY"
    });
  });

  it("uses the exact median of prior position sizes", () => {
    const results = evaluateBehaviorRules({ ...base, quantity: "1.5000000001" });
    expect(results[1]).toMatchObject({ status: "FAIL", type: "POSITION_INCREASE" });
  });

  it("returns UNKNOWN when stop or position evidence is insufficient", () => {
    const results = evaluateBehaviorRules({ ...base, priorQuantities: ["1", "2"] });
    expect(results[1]).toMatchObject({ evidenceType: "MISSING_DATA", status: "UNKNOWN" });
    expect(results[2]).toMatchObject({ evidenceType: "MISSING_DATA", status: "UNKNOWN" });
  });

  it("fails daily limits and mismatched plans", () => {
    const results = evaluateBehaviorRules({
      ...base,
      currentPlaybookId: "other",
      dailyTradeIds: ["1", "2", "3", "4", "5", "6"]
    });
    expect(results[3]?.status).toBe("FAIL");
    expect(results[4]?.status).toBe("FAIL");
  });

  it("uses a stop event as evidence when an adverse stop move is known", () => {
    const result = evaluateBehaviorRules({
      ...base,
      movedStop: true,
      movedStopEvidenceId: "stop-event-1"
    })[2];
    expect(result).toMatchObject({
      evidenceId: "stop-event-1",
      status: "FAIL",
      type: "MOVED_STOP"
    });
  });

  it("passes rules when supported evidence stays within limits", () => {
    const results = evaluateBehaviorRules({
      ...base,
      movedStop: false,
      openedAt: "2026-01-01T11:00:00Z"
    });
    expect(results.map(({ status }) => status)).toEqual(["PASS", "PASS", "PASS", "PASS", "PASS"]);
  });
});
