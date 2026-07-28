import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { calculateResultScore, RESULT_SCORE_VERSION } from "@rulivo/analytics-core";
import { PrismaService } from "../database/prisma.service.js";

export const RESULT_SCORE_METHOD = {
  version: RESULT_SCORE_VERSION,
  formula: "Total = risk-adjusted result (50) + plan target achievement (30) + outcome (20)",
  riskAdjusted: "R from -1R to +1R maps linearly to 0–50; values outside are capped.",
  targetAchievement: "max(R, 0) divided by planned target R maps 0–100% to 0–30.",
  outcome: "Net profit scores 20, breakeven 10, and net loss 0."
} as const;

@Injectable()
export class ResultScoreService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async calculate(userId: string, tradeId: string, plannedTarget?: string | null) {
    const trade = await this.prisma.trade.findFirst({ where: { id: tradeId, userId } });
    if (trade === null) throw new NotFoundException("Trade not found");
    if (plannedTarget === null) {
      await this.prisma.trade.update({
        data: {
          plannedTargetRMultiple: null,
          resultScore: null,
          resultScoreCalculatedAt: null,
          resultScoreVersion: null
        },
        where: { id: trade.id }
      });
      return { method: RESULT_SCORE_METHOD, score: null };
    }
    const target = plannedTarget ?? trade.plannedTargetRMultiple?.toFixed(6);
    if (target === undefined)
      throw new BadRequestException("Planned target R multiple is required");
    if (trade.rMultiple === null || trade.realizedPnlMinor === null) {
      throw new BadRequestException("Trade analytics must be calculated before result scoring");
    }
    let score;
    try {
      score = calculateResultScore(trade.rMultiple.toFixed(6), target, trade.realizedPnlMinor);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Invalid score input");
    }
    const calculatedAt = new Date();
    await this.prisma.trade.update({
      data: {
        plannedTargetRMultiple: target,
        resultScore: score.resultScore,
        resultScoreCalculatedAt: calculatedAt,
        resultScoreVersion: RESULT_SCORE_VERSION
      },
      where: { id: trade.id }
    });
    return {
      calculatedAt,
      method: RESULT_SCORE_METHOD,
      plannedTargetRMultiple: target,
      rMultiple: trade.rMultiple.toFixed(6),
      ...score
    };
  }
}
