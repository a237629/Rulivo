import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../database/prisma.service.js";
import { PatternConfidenceService } from "./pattern-confidence.service.js";

describe("PatternConfidenceService", () => {
  it("scopes metrics to the authenticated user and serializes decimals", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        dataCompleteness: { toNumber: () => 0.8 },
        effectSize: { toNumber: () => 0.6 },
        patternType: "LOSS_REENTRY"
      }
    ]);
    const prisma = {
      behaviorPatternConfidence: { findMany }
    } as unknown as PrismaService;
    const service = new PatternConfidenceService(prisma);

    await expect(service.get("user-1")).resolves.toEqual([
      { dataCompleteness: 0.8, effectSize: 0.6, patternType: "LOSS_REENTRY" }
    ]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-1" } }));
  });
});
