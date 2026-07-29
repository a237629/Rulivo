import { BadGatewayException, UnprocessableEntityException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../database/prisma.service.js";
import type { PatternExplanationModel } from "./pattern-explanation-model.service.js";
import { PatternExplanationService } from "./pattern-explanation.service.js";

const evidenceId = "0770fc2c-e379-4c09-9813-316d06b35c17";

function dependencies(rows: object[]) {
  const upsert = vi.fn((input: { create: Record<string, unknown> }) =>
    Promise.resolve(input.create)
  );
  const explain = vi.fn();
  const prisma = {
    behaviorPatternConfidence: { findMany: vi.fn().mockResolvedValue(rows) },
    behaviorPatternExplanation: { findUnique: vi.fn(), upsert }
  } as unknown as PrismaService;
  const model = {
    explain,
    modelVersion: "reasoning-model"
  } as unknown as PatternExplanationModel;
  return { explain, model, prisma, upsert };
}

describe("PatternExplanationService", () => {
  it("does not return an explanation after its calculated metrics become stale", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "current-metric" }]);
    const findUnique = vi.fn().mockResolvedValue({
      inputMetricIds: ["old-metric"],
      output: { explanations: [] }
    });
    const prisma = {
      behaviorPatternConfidence: { findMany },
      behaviorPatternExplanation: { findUnique }
    } as unknown as PrismaService;
    const model = { modelVersion: "unused" } as PatternExplanationModel;
    await expect(new PatternExplanationService(prisma, model).get("user-1")).resolves.toBeNull();
  });

  it("rejects generation without precomputed metrics", async () => {
    const { model, prisma } = dependencies([]);
    await expect(
      new PatternExplanationService(prisma, model).generate("user-1")
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it("validates and stores output with metric, model, and prompt provenance", async () => {
    const { explain, model, prisma, upsert } = dependencies([
      {
        algorithmVersion: "pattern-confidence-v1",
        confidenceScore: 0,
        counterexampleCount: 0,
        dataCompleteness: { toNumber: () => 1 },
        dominantStatus: "FAIL",
        effectSize: { toNumber: () => 1 },
        failCount: 1,
        id: evidenceId,
        knownSampleSize: 1,
        level: "INSUFFICIENT",
        passCount: 0,
        patternType: "LOSS_REENTRY",
        sampleSize: 1,
        unknownCount: 0
      }
    ]);
    explain.mockResolvedValue({
      explanations: [
        {
          conclusion: "现有样本显示失败行为占主导。",
          limitations: ["样本尚未达到最低门槛。"],
          numeric_claims: [{ evidence_id: evidenceId, metric: "SAMPLE_SIZE", value: 1 }],
          pattern_type: "LOSS_REENTRY"
        }
      ]
    });

    await new PatternExplanationService(prisma, model).generate("user-1");
    expect(explain).toHaveBeenCalledWith([
      expect.objectContaining({ evidence_id: evidenceId, sample_size: 1 })
    ]);
    const call = upsert.mock.calls[0]?.[0];
    expect(call?.create.inputFingerprint).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(call?.create).toMatchObject({
      inputMetricIds: [evidenceId],
      modelVersion: "reasoning-model",
      promptVersion: "pattern-explanation-v1",
      userId: "user-1"
    });
  });

  it("rejects model numbers that do not match their evidence", async () => {
    const { explain, model, prisma } = dependencies([
      {
        algorithmVersion: "pattern-confidence-v1",
        confidenceScore: 0,
        counterexampleCount: 0,
        dataCompleteness: { toNumber: () => 1 },
        dominantStatus: "FAIL",
        effectSize: { toNumber: () => 1 },
        failCount: 1,
        id: evidenceId,
        knownSampleSize: 1,
        level: "INSUFFICIENT",
        passCount: 0,
        patternType: "LOSS_REENTRY",
        sampleSize: 1,
        unknownCount: 0
      }
    ]);
    explain.mockResolvedValue({
      explanations: [
        {
          conclusion: "现有样本显示失败行为占主导。",
          limitations: [],
          numeric_claims: [{ evidence_id: evidenceId, metric: "SAMPLE_SIZE", value: 99 }],
          pattern_type: "LOSS_REENTRY"
        }
      ]
    });
    await expect(
      new PatternExplanationService(prisma, model).generate("user-1")
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
