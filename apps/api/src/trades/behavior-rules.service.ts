import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { evaluateBehaviorRules, type BehaviorRuleType } from "@rulivo/analytics-core";
import { PrismaService } from "../database/prisma.service.js";

export interface CreatePlaybookInput {
  lossReentryMinutes: number;
  maxDailyTrades: number;
  name: string;
  positionIncreasePercent: number;
}

export interface StopEventInput {
  newStopPriceMinor: string;
  occurredAt: string;
  previousStopPriceMinor: string;
}

const ALGORITHM_VERSION = "behavior-rules-v1";

function dateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).format(date);
}

function configNumber(config: unknown, key: string): number {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new BadRequestException("Playbook rule configuration is invalid");
  }
  const value = (config as Record<string, unknown>)[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new BadRequestException(`Playbook rule ${key} is invalid`);
  }
  return value;
}

@Injectable()
export class BehaviorRulesService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async createPlaybook(userId: string, input: CreatePlaybookInput) {
    const existing = await this.prisma.playbook.findUnique({
      where: { userId_name: { name: input.name, userId } }
    });
    if (existing !== null) throw new ConflictException("Playbook name already exists");
    return this.prisma.playbook.create({
      data: {
        name: input.name,
        rules: {
          create: [
            { config: { minutes: input.lossReentryMinutes }, type: "LOSS_REENTRY" },
            {
              config: { increasePercent: input.positionIncreasePercent, baselineTrades: 20 },
              type: "POSITION_INCREASE"
            },
            { config: { requiresStopHistory: true }, type: "MOVED_STOP" },
            { config: { maxTrades: input.maxDailyTrades }, type: "DAILY_TRADE_LIMIT" },
            { config: { requiresAssignedPlaybook: true }, type: "PLAN_DEVIATION" }
          ]
        },
        userId
      },
      include: { rules: { orderBy: { type: "asc" } } }
    });
  }

  public async assignPlaybook(userId: string, tradeId: string, playbookId: string | null) {
    const trade = await this.prisma.trade.findFirst({ where: { id: tradeId, userId } });
    if (trade === null) throw new NotFoundException("Trade was not found");
    if (playbookId !== null) {
      const playbook = await this.prisma.playbook.findFirst({
        where: { id: playbookId, isActive: true, userId }
      });
      if (playbook === null) throw new NotFoundException("Playbook was not found");
    }
    const updated = await this.prisma.trade.update({
      data: { playbookId },
      select: { id: true, playbookId: true },
      where: { id: tradeId }
    });
    return updated;
  }

  public async recordStopEvent(userId: string, tradeId: string, input: StopEventInput) {
    const trade = await this.prisma.trade.findFirst({
      select: { id: true },
      where: { id: tradeId, userId }
    });
    if (trade === null) throw new NotFoundException("Trade was not found");
    const event = await this.prisma.tradeStopEvent.create({
      data: {
        newStopPriceMinor: BigInt(input.newStopPriceMinor),
        occurredAt: new Date(input.occurredAt),
        previousStopPriceMinor: BigInt(input.previousStopPriceMinor),
        tradeId
      }
    });
    return {
      ...event,
      newStopPriceMinor: event.newStopPriceMinor.toString(),
      previousStopPriceMinor: event.previousStopPriceMinor.toString()
    };
  }

  public async evaluate(userId: string, tradeId: string, playbookId: string) {
    const [trade, playbook, profile] = await Promise.all([
      this.prisma.trade.findFirst({ where: { id: tradeId, userId } }),
      this.prisma.playbook.findFirst({
        include: { rules: { where: { enabled: true } } },
        where: { id: playbookId, isActive: true, userId }
      }),
      this.prisma.userProfile.findUnique({
        select: { timeZone: true },
        where: { userId }
      })
    ]);
    if (trade === null) throw new NotFoundException("Trade was not found");
    if (playbook === null) throw new NotFoundException("Playbook was not found");
    const ruleByType = new Map(playbook.rules.map((rule) => [rule.type, rule]));
    const requiredTypes: BehaviorRuleType[] = [
      "LOSS_REENTRY",
      "POSITION_INCREASE",
      "MOVED_STOP",
      "DAILY_TRADE_LIMIT",
      "PLAN_DEVIATION"
    ];
    if (requiredTypes.some((type) => !ruleByType.has(type))) {
      throw new BadRequestException("Playbook does not contain every required behavior rule");
    }

    const [previousLoss, priorTrades, nearbyTrades, stopEvents] = await Promise.all([
      this.prisma.trade.findFirst({
        orderBy: [{ closedAt: "desc" }, { id: "desc" }],
        select: { closedAt: true, id: true },
        where: {
          closedAt: { lte: trade.openedAt },
          id: { not: trade.id },
          realizedPnlMinor: { lt: 0n },
          status: "CLOSED",
          tradingAccountId: trade.tradingAccountId,
          userId
        }
      }),
      this.prisma.trade.findMany({
        orderBy: [{ openedAt: "desc" }, { id: "desc" }],
        select: { quantity: true },
        take: 20,
        where: {
          id: { not: trade.id },
          openedAt: { lt: trade.openedAt },
          tradingAccountId: trade.tradingAccountId,
          userId
        }
      }),
      this.prisma.trade.findMany({
        select: { id: true, openedAt: true },
        where: {
          openedAt: {
            gte: new Date(trade.openedAt.valueOf() - 86_400_000),
            lt: new Date(trade.openedAt.valueOf() + 86_400_000)
          },
          tradingAccountId: trade.tradingAccountId,
          userId
        }
      }),
      this.prisma.tradeStopEvent.findMany({
        orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
        where: { tradeId: trade.id }
      })
    ]);
    const timeZone = profile?.timeZone ?? "UTC";
    const localDay = dateKey(trade.openedAt, timeZone);
    const dailyTradeIds = nearbyTrades
      .filter((candidate) => dateKey(candidate.openedAt, timeZone) === localDay)
      .map(({ id }) => id);
    const results = evaluateBehaviorRules({
      currentPlaybookId: trade.playbookId,
      dailyTradeIds,
      evaluatedPlaybookId: playbook.id,
      lossReentryMinutes: configNumber(ruleByType.get("LOSS_REENTRY")?.config, "minutes"),
      maxDailyTrades: configNumber(ruleByType.get("DAILY_TRADE_LIMIT")?.config, "maxTrades"),
      movedStop:
        stopEvents.length === 0
          ? null
          : stopEvents.some((event) =>
              trade.side === "LONG"
                ? event.newStopPriceMinor < event.previousStopPriceMinor
                : event.newStopPriceMinor > event.previousStopPriceMinor
            ),
      movedStopEvidenceId: stopEvents.at(-1)?.id,
      openedAt: trade.openedAt,
      positionIncreasePercent: configNumber(
        ruleByType.get("POSITION_INCREASE")?.config,
        "increasePercent"
      ),
      previousLoss:
        previousLoss?.closedAt === null || previousLoss === null
          ? null
          : { closedAt: previousLoss.closedAt, id: previousLoss.id },
      priorQuantities: priorTrades.map(({ quantity }) => quantity.toFixed()),
      quantity: trade.quantity.toFixed(),
      tradeId: trade.id
    });

    const persisted = await this.prisma.$transaction(
      results.map((result) => {
        const rule = ruleByType.get(result.type);
        if (rule === undefined) throw new BadRequestException("Playbook rule is missing");
        return this.prisma.tradeRuleResult.upsert({
          create: {
            algorithmVersion: ALGORITHM_VERSION,
            confidence: result.confidence,
            evidenceId: result.evidenceId,
            evidenceType: result.evidenceType,
            explanation: result.explanation,
            playbookRuleId: rule.id,
            status: result.status,
            tradeId: trade.id
          },
          update: {
            algorithmVersion: ALGORITHM_VERSION,
            confidence: result.confidence,
            evidenceId: result.evidenceId,
            evidenceType: result.evidenceType,
            evaluatedAt: new Date(),
            explanation: result.explanation,
            status: result.status
          },
          where: {
            tradeId_playbookRuleId: {
              playbookRuleId: rule.id,
              tradeId: trade.id
            }
          }
        });
      })
    );
    await this.prisma.trade.update({
      data: {
        executionScore: null,
        executionScoreCalculatedAt: null,
        executionScoreVersion: null,
        quadrantCalculatedAt: null,
        quadrantEvaluation: null,
        quadrantVersion: null
      },
      where: { id: trade.id }
    });
    return persisted;
  }

  public async results(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      select: { id: true },
      where: { id: tradeId, userId }
    });
    if (trade === null) throw new NotFoundException("Trade was not found");
    return this.prisma.tradeRuleResult.findMany({
      include: { playbookRule: { select: { type: true } } },
      orderBy: { playbookRule: { type: "asc" } },
      where: { tradeId }
    });
  }
}
