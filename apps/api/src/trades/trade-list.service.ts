import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { TradeListQuery } from "./trade-list.query.js";

function resultFilter(result: TradeListQuery["result"]): Prisma.TradeWhereInput | undefined {
  switch (result) {
    case "WIN":
      return { realizedPnlMinor: { gt: 0n } };
    case "LOSS":
      return { realizedPnlMinor: { lt: 0n } };
    case "BREAKEVEN":
      return { realizedPnlMinor: 0n };
    case "UNKNOWN":
      return { realizedPnlMinor: null };
    default:
      return undefined;
  }
}

function endOfUtcDate(date: string): Date {
  return new Date(`${date}T23:59:59.999Z`);
}

@Injectable()
export class TradeListService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async list(userId: string, query: TradeListQuery) {
    const result = resultFilter(query.result);
    const where: Prisma.TradeWhereInput = {
      userId,
      ...(query.accountId === undefined ? {} : { tradingAccountId: query.accountId }),
      ...(query.market === undefined ? {} : { market: query.market }),
      ...(query.strategyId === undefined ? {} : { playbookId: query.strategyId }),
      ...(query.dateFrom === undefined && query.dateTo === undefined
        ? {}
        : {
            openedAt: {
              ...(query.dateFrom === undefined
                ? {}
                : { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) }),
              ...(query.dateTo === undefined ? {} : { lte: endOfUtcDate(query.dateTo) })
            }
          }),
      ...(query.executionScoreMin === undefined && query.executionScoreMax === undefined
        ? {}
        : {
            executionScore: {
              ...(query.executionScoreMin === undefined ? {} : { gte: query.executionScoreMin }),
              ...(query.executionScoreMax === undefined ? {} : { lte: query.executionScoreMax })
            }
          }),
      ...(result ?? {})
    };
    if (query.cursor !== undefined) {
      const ownedCursor = await this.prisma.trade.findFirst({
        select: { id: true },
        where: { id: query.cursor, userId }
      });
      if (!ownedCursor) throw new BadRequestException("Invalid trade-list cursor");
    }
    const rows = await this.prisma.trade.findMany({
      ...(query.cursor === undefined ? {} : { cursor: { id: query.cursor }, skip: 1 }),
      orderBy: [{ openedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        symbol: true,
        market: true,
        side: true,
        openedAt: true,
        closedAt: true,
        status: true,
        currency: true,
        realizedPnlMinor: true,
        executionScore: true,
        tradingAccount: { select: { id: true, name: true } },
        playbook: { select: { id: true, name: true } }
      },
      take: query.limit + 1,
      where
    });
    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      items: page.map((trade) => ({
        ...trade,
        realizedPnlMinor: trade.realizedPnlMinor?.toString() ?? null,
        result:
          trade.realizedPnlMinor === null
            ? "UNKNOWN"
            : trade.realizedPnlMinor > 0n
              ? "WIN"
              : trade.realizedPnlMinor < 0n
                ? "LOSS"
                : "BREAKEVEN"
      })),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null
    };
  }
}
