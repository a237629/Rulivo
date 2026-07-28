import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { evaluateTradeQuadrant, TRADE_QUADRANT_VERSION } from "@rulivo/analytics-core";
import { PrismaService } from "../database/prisma.service.js";

export const TRADE_QUADRANT_METHOD = {
  version: TRADE_QUADRANT_VERSION,
  mappings: {
    EXCELLENT: "profit + followed rules",
    QUALIFIED: "loss + followed rules",
    DANGEROUS: "profit + violated rules",
    ERROR: "loss + violated rules"
  },
  unknownPolicy:
    "Breakeven, missing P&L, missing rule dimensions, or UNKNOWN rule evidence remains UNKNOWN."
} as const;

@Injectable()
export class TradeQuadrantService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async evaluate(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      include: { ruleResults: { select: { status: true } } },
      where: { id: tradeId, userId }
    });
    if (trade === null) throw new NotFoundException("Trade not found");
    const evaluation = evaluateTradeQuadrant(
      trade.realizedPnlMinor,
      trade.ruleResults.map(({ status }) => status)
    );
    const calculatedAt = new Date();
    await this.prisma.trade.update({
      data: {
        quadrantCalculatedAt: calculatedAt,
        quadrantEvaluation: evaluation.quadrant,
        quadrantVersion: TRADE_QUADRANT_VERSION
      },
      where: { id: trade.id }
    });
    return { calculatedAt, method: TRADE_QUADRANT_METHOD, ...evaluation };
  }
}
