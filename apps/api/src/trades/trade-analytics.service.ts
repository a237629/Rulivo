import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { calculateRMultiple, calculateTrade } from "@rulivo/analytics-core";
import { PrismaService } from "../database/prisma.service.js";

interface CalculateAnalyticsInput {
  initialRiskMinor?: string | null | undefined;
}

@Injectable()
export class TradeAnalyticsService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async calculate(userId: string, tradeId: string, input: CalculateAnalyticsInput) {
    const trade = await this.prisma.trade.findFirst({
      include: {
        executions: {
          include: { fees: true },
          orderBy: { sequence: "asc" }
        }
      },
      where: { id: tradeId, userId }
    });
    if (trade === null) throw new NotFoundException("Trade was not found");
    if (trade.executions.length === 0) {
      throw new BadRequestException("Trade requires at least one execution");
    }

    const calculation = calculateTrade(
      trade.side,
      trade.executions.map((execution) => ({
        action: execution.action,
        feesMinor: execution.fees.map((fee) => fee.amountMinor),
        priceMinor: execution.priceMinor,
        quantity: execution.quantity.toFixed()
      }))
    );
    const initialRiskMinor =
      input.initialRiskMinor === undefined
        ? trade.initialRiskMinor
        : input.initialRiskMinor === null
          ? null
          : BigInt(input.initialRiskMinor);
    const rMultiple =
      initialRiskMinor === null
        ? null
        : calculateRMultiple(calculation.netPnlMinor, initialRiskMinor);
    const analyticsCalculatedAt = new Date();

    await this.prisma.trade.update({
      data: {
        analyticsCalculatedAt,
        initialRiskMinor,
        rMultiple,
        realizedPnlMinor: calculation.netPnlMinor,
        resultScore: null,
        resultScoreCalculatedAt: null,
        resultScoreVersion: null,
        quadrantCalculatedAt: null,
        quadrantEvaluation: null,
        quadrantVersion: null
      },
      where: { id: trade.id }
    });
    return {
      analyticsCalculatedAt,
      closedQuantity: calculation.closedQuantity,
      feesMinor: calculation.feesMinor.toString(),
      grossPnlMinor: calculation.grossPnlMinor.toString(),
      initialRiskMinor: initialRiskMinor?.toString() ?? null,
      netPnlMinor: calculation.netPnlMinor.toString(),
      rMultiple,
      remainingQuantity: calculation.remainingQuantity,
      status: calculation.status,
      tradeId
    };
  }
}
