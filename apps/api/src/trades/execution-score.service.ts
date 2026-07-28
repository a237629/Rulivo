import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  calculateExecutionScore,
  EXECUTION_SCORE_VERSION,
  type ExecutionDimension
} from "@rulivo/analytics-core";
import type { BehaviorRuleType } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";

const DIMENSION_BY_RULE: Record<BehaviorRuleType, ExecutionDimension> = {
  DAILY_TRADE_LIMIT: "RULES",
  POSITION_INCREASE: "POSITION",
  MOVED_STOP: "STOP",
  PLAN_DEVIATION: "PLAN",
  LOSS_REENTRY: "EMOTION"
};

export const EXECUTION_SCORE_METHOD = {
  version: EXECUTION_SCORE_VERSION,
  formula: "Score = passed known dimensions / all known dimensions × 100",
  unknownPolicy:
    "UNKNOWN dimensions are excluded from the denominator and never treated as failures.",
  dimensions: {
    RULES: "Daily trade-limit compliance",
    POSITION: "Position-size increase control",
    STOP: "Stop-movement discipline",
    PLAN: "Assigned playbook adherence",
    EMOTION: "Observable post-loss re-entry behavior; it does not infer internal emotion"
  }
} as const;

@Injectable()
export class ExecutionScoreService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async calculate(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      include: { ruleResults: { include: { playbookRule: { select: { type: true } } } } },
      where: { id: tradeId, userId }
    });
    if (trade === null) throw new NotFoundException("Trade not found");
    const score = calculateExecutionScore(
      trade.ruleResults.map((result) => ({
        dimension: DIMENSION_BY_RULE[result.playbookRule.type],
        status: result.status
      }))
    );
    const calculatedAt = new Date();
    await this.prisma.trade.update({
      data:
        score.executionScore === null
          ? {
              executionScore: null,
              executionScoreCalculatedAt: null,
              executionScoreVersion: null
            }
          : {
              executionScore: score.executionScore,
              executionScoreCalculatedAt: calculatedAt,
              executionScoreVersion: EXECUTION_SCORE_VERSION
            },
      where: { id: trade.id }
    });
    return {
      calculatedAt: score.executionScore === null ? null : calculatedAt,
      method: EXECUTION_SCORE_METHOD,
      ...score
    };
  }
}
