import { describe, expect, it } from "vitest";
import { nextFollowUpQuestion } from "./follow-up-question.js";

describe("follow-up question selection", () => {
  it("asks one highest-priority missing-evidence question", () => {
    const question = nextFollowUpQuestion(["PLAN_DEVIATION", "MOVED_STOP"], []);
    expect(question?.evidenceKey).toBe("MOVED_STOP");
    expect(question?.quickOptions).toHaveLength(3);
  });

  it("does not repeat evidence already asked", () => {
    expect(
      nextFollowUpQuestion(["MOVED_STOP", "PLAN_DEVIATION"], ["MOVED_STOP"])?.evidenceKey
    ).toBe("PLAN_DEVIATION");
  });

  it("returns null when no missing evidence remains", () => {
    expect(nextFollowUpQuestion([], [])).toBeNull();
  });
});
