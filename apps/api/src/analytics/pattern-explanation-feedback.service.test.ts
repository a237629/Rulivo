import { ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../database/prisma.service.js";
import { PatternExplanationFeedbackService } from "./pattern-explanation-feedback.service.js";

const explanationId = "0770fc2c-e379-4c09-9813-316d06b35c17";

function explanation() {
  return {
    id: explanationId,
    inputFingerprint: "a".repeat(64),
    modelVersion: "reasoning-model",
    output: {
      explanations: [
        {
          conclusion: "当前解释需要用户复核。",
          limitations: [],
          numeric_claims: [
            {
              evidence_id: "b4be8f03-20d0-4c96-b02f-7afcd932c88b",
              metric: "SAMPLE_SIZE",
              value: 1
            }
          ],
          pattern_type: "LOSS_REENTRY"
        }
      ]
    },
    promptVersion: "pattern-explanation-v1",
    userId: "user-1"
  };
}

describe("PatternExplanationFeedbackService", () => {
  it("appends a correction snapshot without updating historical facts or the explanation", async () => {
    const create = vi.fn(
      (input: {
        data: {
          explanationInputFingerprint: string;
          explanationOutputSnapshot: { pattern_type: string };
          reason: string;
          userId: string;
        };
      }) => Promise.resolve({ id: "feedback-1", input })
    );
    const prisma = {
      behaviorPatternExplanation: { findFirst: vi.fn().mockResolvedValue(explanation()) },
      patternExplanationFeedback: {
        create,
        findFirst: vi.fn().mockResolvedValue(null)
      }
    } as unknown as PrismaService;

    await new PatternExplanationFeedbackService(prisma).submit("user-1", explanationId, {
      comment: "The cited evidence belongs to another event.",
      patternType: "LOSS_REENTRY",
      reason: "EVIDENCE_ERROR"
    });

    const call = create.mock.calls[0]?.[0];
    expect(call?.data.explanationInputFingerprint).toBe("a".repeat(64));
    expect(call?.data.explanationOutputSnapshot.pattern_type).toBe("LOSS_REENTRY");
    expect(call?.data.reason).toBe("EVIDENCE_ERROR");
    expect(call?.data.userId).toBe("user-1");
    expect(prisma).not.toHaveProperty("trade.update");
    expect(prisma).not.toHaveProperty("behaviorEvidenceSnapshot.update");
    expect(prisma).not.toHaveProperty("behaviorPatternExplanation.update");
  });

  it("rejects another user's explanation and duplicate feedback", async () => {
    const missingPrisma = {
      behaviorPatternExplanation: { findFirst: vi.fn().mockResolvedValue(null) }
    } as unknown as PrismaService;
    await expect(
      new PatternExplanationFeedbackService(missingPrisma).submit("user-2", explanationId, {
        patternType: "LOSS_REENTRY",
        reason: "INACCURATE"
      })
    ).rejects.toBeInstanceOf(NotFoundException);

    const duplicatePrisma = {
      behaviorPatternExplanation: { findFirst: vi.fn().mockResolvedValue(explanation()) },
      patternExplanationFeedback: { findFirst: vi.fn().mockResolvedValue({ id: "existing" }) }
    } as unknown as PrismaService;
    await expect(
      new PatternExplanationFeedbackService(duplicatePrisma).submit("user-1", explanationId, {
        patternType: "LOSS_REENTRY",
        reason: "UNHELPFUL"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
