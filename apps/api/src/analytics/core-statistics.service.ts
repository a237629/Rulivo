import { Inject, Injectable } from "@nestjs/common";
import {
  calculateCoreStatistics,
  type CoreStatistics,
  type PerformanceBucket
} from "@rulivo/analytics-core";
import { PrismaService } from "../database/prisma.service.js";

export interface CoreStatisticsQuery {
  from?: string | undefined;
  timeZone?: string | undefined;
  to?: string | undefined;
  tradingAccountId?: string | undefined;
}

function serializeBucket(bucket: PerformanceBucket) {
  return { ...bucket, netPnlMinor: bucket.netPnlMinor.toString() };
}

function serializeStatistics(statistics: CoreStatistics) {
  return {
    ...statistics,
    grossLossMinor: statistics.grossLossMinor.toString(),
    grossProfitMinor: statistics.grossProfitMinor.toString(),
    hourly: Object.fromEntries(
      Object.entries(statistics.hourly).map(([key, bucket]) => [key, serializeBucket(bucket)])
    ),
    maxDrawdownMinor: statistics.maxDrawdownMinor.toString(),
    netPnlMinor: statistics.netPnlMinor.toString(),
    weekday: Object.fromEntries(
      Object.entries(statistics.weekday).map(([key, bucket]) => [key, serializeBucket(bucket)])
    )
  };
}

@Injectable()
export class CoreStatisticsService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async get(userId: string, query: CoreStatisticsQuery) {
    const profile = await this.prisma.userProfile.findUnique({
      select: { timeZone: true },
      where: { userId }
    });
    const timeZone = query.timeZone ?? profile?.timeZone ?? "UTC";
    // Validate before querying so an invalid zone returns a stable client error upstream.
    calculateCoreStatistics([], timeZone);

    const trades = await this.prisma.trade.findMany({
      orderBy: [{ closedAt: "asc" }, { id: "asc" }],
      select: {
        closedAt: true,
        currency: true,
        id: true,
        realizedPnlMinor: true
      },
      where: {
        closedAt: {
          ...(query.from === undefined ? {} : { gte: new Date(query.from) }),
          ...(query.to === undefined ? {} : { lt: new Date(query.to) })
        },
        realizedPnlMinor: { not: null },
        status: "CLOSED",
        ...(query.tradingAccountId === undefined
          ? {}
          : { tradingAccountId: query.tradingAccountId }),
        userId
      }
    });
    const currencies = new Map<string, { closedAt: Date; id: string; pnlMinor: bigint }[]>();
    for (const trade of trades) {
      if (trade.closedAt === null || trade.realizedPnlMinor === null) continue;
      const currency = trade.currency.trim();
      const group = currencies.get(currency) ?? [];
      group.push({
        closedAt: trade.closedAt,
        id: trade.id,
        pnlMinor: trade.realizedPnlMinor
      });
      currencies.set(currency, group);
    }

    return {
      currencies: [...currencies.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([currency, currencyTrades]) => ({
          currency,
          ...serializeStatistics(calculateCoreStatistics(currencyTrades, timeZone))
        })),
      from: query.from ?? null,
      timeZone,
      to: query.to ?? null,
      totalSampleSize: trades.length,
      tradingAccountId: query.tradingAccountId ?? null
    };
  }
}
