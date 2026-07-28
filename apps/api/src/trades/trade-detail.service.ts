import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { buildExecutionChart } from "./trade-detail-chart.js";
import { RESULT_SCORE_METHOD } from "./result-score.service.js";
import { calculateExecutionScore } from "@rulivo/analytics-core";
import { EXECUTION_SCORE_METHOD } from "./execution-score.service.js";
import { evaluateTradeQuadrant } from "@rulivo/analytics-core";
import { TRADE_QUADRANT_METHOD } from "./trade-quadrant.service.js";

@Injectable()
export class TradeDetailService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async requireTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId },
      include: {
        executions: { include: { fees: true }, orderBy: [{ sequence: "asc" }] },
        images: {
          include: { parses: { orderBy: { createdAt: "desc" }, take: 1 } },
          orderBy: { createdAt: "asc" }
        },
        notes: { orderBy: { createdAt: "asc" } },
        ruleResults: {
          include: { playbookRule: { select: { type: true } } },
          orderBy: { evaluatedAt: "asc" }
        },
        voiceRecordings: { include: { transcription: true }, orderBy: { createdAt: "asc" } },
        tradingAccount: { select: { id: true, name: true } },
        playbook: { select: { id: true, name: true } }
      }
    });
    if (!trade) throw new NotFoundException("Trade not found");
    return trade;
  }

  public async get(userId: string, tradeId: string) {
    const trade = await this.requireTrade(userId, tradeId);
    const executionBreakdown = calculateExecutionScore(
      trade.ruleResults.map((result) => ({
        dimension:
          result.playbookRule.type === "DAILY_TRADE_LIMIT"
            ? "RULES"
            : result.playbookRule.type === "POSITION_INCREASE"
              ? "POSITION"
              : result.playbookRule.type === "MOVED_STOP"
                ? "STOP"
                : result.playbookRule.type === "PLAN_DEVIATION"
                  ? "PLAN"
                  : "EMOTION",
        status: result.status
      }))
    );
    const currentQuadrant = evaluateTradeQuadrant(
      trade.realizedPnlMinor,
      trade.ruleResults.map(({ status }) => status)
    );
    return {
      id: trade.id,
      symbol: trade.symbol,
      market: trade.market,
      side: trade.side,
      openedAt: trade.openedAt,
      closedAt: trade.closedAt,
      status: trade.status,
      currency: trade.currency,
      quantity: trade.quantity.toFixed(),
      entryPriceMinor: trade.entryPriceMinor.toString(),
      exitPriceMinor: trade.exitPriceMinor?.toString() ?? null,
      realizedPnlMinor: trade.realizedPnlMinor?.toString() ?? null,
      executionScore: {
        calculatedAt: trade.executionScoreCalculatedAt,
        coveragePercent: executionBreakdown.coveragePercent,
        dimensions: executionBreakdown.dimensions,
        method: EXECUTION_SCORE_METHOD,
        score: trade.executionScore,
        version: trade.executionScoreVersion
      },
      resultScore:
        trade.resultScore === null
          ? null
          : {
              calculatedAt: trade.resultScoreCalculatedAt,
              method: RESULT_SCORE_METHOD,
              plannedTargetRMultiple: trade.plannedTargetRMultiple?.toFixed(6) ?? null,
              score: trade.resultScore,
              version: trade.resultScoreVersion
            },
      quadrant: {
        calculatedAt: trade.quadrantCalculatedAt,
        disciplineAxis: currentQuadrant.disciplineAxis,
        method: TRADE_QUADRANT_METHOD,
        profitAxis: currentQuadrant.profitAxis,
        reason: currentQuadrant.reason,
        value: trade.quadrantEvaluation,
        version: trade.quadrantVersion
      },
      tradingAccount: trade.tradingAccount,
      playbook: trade.playbook,
      chart: buildExecutionChart(trade.executions),
      executions: trade.executions.map((item) => ({
        id: item.id,
        sequence: item.sequence,
        action: item.action,
        executedAt: item.executedAt,
        quantity: item.quantity.toFixed(),
        priceMinor: item.priceMinor.toString(),
        fees: item.fees.map((fee) => ({
          id: fee.id,
          type: fee.type,
          amountMinor: fee.amountMinor.toString(),
          currency: fee.currency
        }))
      })),
      screenshots: trade.images.map((image) => ({
        id: image.id,
        mediaType: image.mediaType,
        width: image.width,
        height: image.height,
        source: image.source,
        createdAt: image.createdAt,
        contentPath: `/images/${image.id}/content`,
        latestParseStatus: image.parses[0]?.status ?? null
      })),
      notes: trade.notes,
      voiceRecordings: trade.voiceRecordings.map((recording) => ({
        id: recording.id,
        mediaType: recording.mediaType,
        durationMs: recording.durationMs,
        createdAt: recording.createdAt,
        contentPath:
          recording.objectDeletedAt === null ? `/voice-recordings/${recording.id}/content` : null,
        transcription:
          recording.transcription === null
            ? null
            : {
                id: recording.transcription.id,
                status: recording.transcription.status,
                text: recording.transcription.confirmedText ?? recording.transcription.candidateText
              }
      })),
      ruleResults: trade.ruleResults.map((result) => ({
        id: result.id,
        ruleType: result.playbookRule.type,
        status: result.status,
        evidenceType: result.evidenceType,
        evidenceId: result.evidenceId,
        explanation: result.explanation,
        confidence: result.confidence.toFixed(3),
        algorithmVersion: result.algorithmVersion,
        evaluatedAt: result.evaluatedAt
      }))
    };
  }

  public async createNote(userId: string, tradeId: string, body: string) {
    await this.requireTrade(userId, tradeId);
    return this.prisma.tradeNote.create({ data: { userId, tradeId, body } });
  }

  public async updateNote(userId: string, tradeId: string, noteId: string, body: string) {
    const result = await this.prisma.tradeNote.updateMany({
      data: { body },
      where: { id: noteId, tradeId, userId }
    });
    if (result.count === 0) throw new NotFoundException("Trade note not found");
    return this.prisma.tradeNote.findFirstOrThrow({ where: { id: noteId, tradeId, userId } });
  }

  public async deleteNote(userId: string, tradeId: string, noteId: string) {
    const result = await this.prisma.tradeNote.deleteMany({
      where: { id: noteId, tradeId, userId }
    });
    if (result.count === 0) throw new NotFoundException("Trade note not found");
    return { deleted: true };
  }
}
