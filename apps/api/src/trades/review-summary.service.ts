import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { buildReviewSummary, REVIEW_SUMMARY_VERSION } from "./review-summary.js";

@Injectable()
export class ReviewSummaryService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async generate(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      include: {
        executions: { orderBy: [{ executedAt: "asc" }, { sequence: "asc" }] },
        ruleResults: { include: { playbookRule: { select: { type: true } } } },
        voiceRecordings: {
          include: {
            transcription: { include: { insightExtraction: true } }
          },
          where: { transcription: { is: { status: "CONFIRMED" } } }
        }
      },
      where: { id: tradeId, userId }
    });
    if (trade === null) throw new NotFoundException("Trade not found");
    const summary = buildReviewSummary(trade);
    const persistedSummary = summary as unknown as Prisma.InputJsonValue;
    return this.prisma.tradeReviewSummary.upsert({
      create: {
        generatorVersion: REVIEW_SUMMARY_VERSION,
        summary: persistedSummary,
        tradeId,
        userId
      },
      update: {
        generatedAt: new Date(),
        generatorVersion: REVIEW_SUMMARY_VERSION,
        summary: persistedSummary
      },
      where: { tradeId }
    });
  }

  public async get(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      select: { id: true },
      where: { id: tradeId, userId }
    });
    if (trade === null) throw new NotFoundException("Trade not found");
    return this.prisma.tradeReviewSummary.findUnique({ where: { tradeId } });
  }
}
