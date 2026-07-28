import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import {
  FOLLOW_UP_VERSION,
  nextFollowUpQuestion,
  type MissingEvidenceKey
} from "./follow-up-question.js";

interface AnswerInput {
  freeText?: string | undefined;
  selectedOption?: string | undefined;
}

const MAX_ROUNDS = 3;

@Injectable()
export class FollowUpService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async ownedTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      include: {
        ruleResults: {
          include: { playbookRule: { select: { type: true } } }
        }
      },
      where: { id: tradeId, userId }
    });
    if (trade === null) throw new NotFoundException("Trade not found");
    return trade;
  }

  private missingEvidence(
    trade: Awaited<ReturnType<FollowUpService["ownedTrade"]>>
  ): { id: string; key: MissingEvidenceKey }[] {
    return trade.ruleResults
      .filter((result) => result.status === "UNKNOWN" || result.evidenceType === "MISSING_DATA")
      .map((result) => ({ id: result.id, key: result.playbookRule.type }));
  }

  private response(session: {
    completedAt: Date | null;
    currentRound: number;
    id: string;
    status: string;
    turns: {
      answeredAt: Date | null;
      evidenceKey: string;
      freeText: string | null;
      id: string;
      question: string;
      quickOptions: unknown;
      round: number;
      selectedOption: string | null;
    }[];
  }) {
    return {
      ...session,
      maxRounds: MAX_ROUNDS,
      version: FOLLOW_UP_VERSION,
      currentQuestion: session.turns.find(({ answeredAt }) => answeredAt === null) ?? null
    };
  }

  public async start(userId: string, tradeId: string) {
    const trade = await this.ownedTrade(userId, tradeId);
    const existing = await this.prisma.followUpSession.findFirst({
      include: { turns: { orderBy: { round: "asc" } } },
      where: { tradeId, userId, status: "ACTIVE" }
    });
    if (existing !== null) return this.response(existing);

    const missing = this.missingEvidence(trade);
    const next = nextFollowUpQuestion(
      missing.map(({ key }) => key),
      []
    );
    const now = new Date();
    const session = await this.prisma.followUpSession.create({
      data:
        next === null
          ? { completedAt: now, status: "COMPLETED", tradeId, userId }
          : {
              currentRound: 1,
              tradeId,
              turns: {
                create: {
                  evidenceKey: next.evidenceKey,
                  question: next.question,
                  quickOptions: next.quickOptions,
                  round: 1,
                  sourceRuleResultId:
                    missing.find(({ key }) => key === next.evidenceKey)?.id ?? null
                }
              },
              userId
            },
      include: { turns: { orderBy: { round: "asc" } } }
    });
    return this.response(session);
  }

  public async current(userId: string, tradeId: string) {
    await this.ownedTrade(userId, tradeId);
    const session = await this.prisma.followUpSession.findFirst({
      include: { turns: { orderBy: { round: "asc" } } },
      orderBy: { createdAt: "desc" },
      where: { tradeId, userId }
    });
    return session === null ? null : this.response(session);
  }

  public async answer(userId: string, sessionId: string, input: AnswerInput) {
    const session = await this.prisma.followUpSession.findFirst({
      include: { turns: { orderBy: { round: "asc" } } },
      where: { id: sessionId, userId }
    });
    if (session === null) throw new NotFoundException("Follow-up session not found");
    if (session.status !== "ACTIVE") throw new BadRequestException("Follow-up session is closed");
    const turn = session.turns.find(({ answeredAt }) => answeredAt === null);
    if (turn === undefined) throw new BadRequestException("No active follow-up question");
    if (input.selectedOption !== undefined) {
      const options = Array.isArray(turn.quickOptions) ? turn.quickOptions : [];
      if (!options.includes(input.selectedOption)) {
        throw new BadRequestException("Selected option is not valid for this question");
      }
    }
    const answeredAt = new Date();
    await this.prisma.followUpTurn.update({
      data: {
        answeredAt,
        freeText: input.freeText ?? null,
        selectedOption: input.selectedOption ?? null
      },
      where: { id: turn.id }
    });
    if (turn.round >= MAX_ROUNDS) {
      const closed = await this.prisma.followUpSession.update({
        data: { completedAt: answeredAt, status: "MAX_ROUNDS" },
        include: { turns: { orderBy: { round: "asc" } } },
        where: { id: session.id }
      });
      return this.response(closed);
    }

    const trade = await this.ownedTrade(userId, session.tradeId);
    const missing = this.missingEvidence(trade);
    const asked = session.turns.map(({ evidenceKey }) => evidenceKey);
    const next = nextFollowUpQuestion(
      missing.map(({ key }) => key),
      asked
    );
    const updated = await this.prisma.followUpSession.update({
      data:
        next === null
          ? { completedAt: answeredAt, status: "COMPLETED" }
          : {
              currentRound: turn.round + 1,
              turns: {
                create: {
                  evidenceKey: next.evidenceKey,
                  question: next.question,
                  quickOptions: next.quickOptions,
                  round: turn.round + 1,
                  sourceRuleResultId:
                    missing.find(({ key }) => key === next.evidenceKey)?.id ?? null
                }
              }
            },
      include: { turns: { orderBy: { round: "asc" } } },
      where: { id: session.id }
    });
    return this.response(updated);
  }
}
