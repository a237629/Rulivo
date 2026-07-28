import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { assertSeedAllowed } from "./seed-policy.js";

assertSeedAllowed(process.env.APP_ENV);

const connectionString = process.env.DATABASE_URL;

if (connectionString === undefined || connectionString.length === 0) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

const userId = "00000000-0000-4000-8000-000000000001";
const accountId = "00000000-0000-4000-8000-000000000002";
const instrumentId = "00000000-0000-4000-8000-000000000005";
const tradeId = "00000000-0000-4000-8000-000000000003";

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { email: "demo@rulivo.app" },
    update: {},
    create: {
      id: userId,
      email: "demo@rulivo.app",
      profile: {
        create: {
          displayName: "RULIVO Demo",
          locale: "zh-CN",
          timeZone: "Asia/Shanghai",
          defaultCurrency: "USD"
        }
      }
    }
  });

  await prisma.tradingAccount.upsert({
    where: { userId_name: { userId, name: "模拟交易账户" } },
    update: {},
    create: {
      id: accountId,
      userId,
      name: "模拟交易账户",
      provider: "RULIVO",
      accountType: "paper",
      baseCurrency: "USD"
    }
  });

  await prisma.userRoleAssignment.createMany({
    data: [
      { role: "USER", userId },
      { role: "ADMIN", userId }
    ],
    skipDuplicates: true
  });

  await prisma.instrument.upsert({
    where: { market_symbol: { market: "NASDAQ", symbol: "AAPL" } },
    update: {},
    create: {
      id: instrumentId,
      symbol: "AAPL",
      market: "NASDAQ",
      name: "Apple Inc.",
      assetClass: "EQUITY",
      currency: "USD",
      priceScale: 2,
      quantityScale: 10
    }
  });

  const instrument = await prisma.instrument.findUniqueOrThrow({
    where: { market_symbol: { market: "NASDAQ", symbol: "AAPL" } }
  });

  await prisma.trade.upsert({
    where: { id: tradeId },
    update: { instrumentId: instrument.id },
    create: {
      id: tradeId,
      userId,
      tradingAccountId: accountId,
      instrumentId: instrument.id,
      symbol: "AAPL",
      market: "NASDAQ",
      side: "LONG",
      openedAt: new Date("2026-01-05T14:30:00.000Z"),
      closedAt: new Date("2026-01-05T19:45:00.000Z"),
      quantity: "10",
      entryPriceMinor: 18_750n,
      exitPriceMinor: 18_920n,
      currency: "USD",
      realizedPnlMinor: 1_700n,
      rMultiple: "1.25",
      source: "MANUAL",
      status: "CLOSED"
    }
  });

  await prisma.execution.upsert({
    where: { tradeId_sequence: { tradeId, sequence: 1 } },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000006",
      tradeId,
      sequence: 1,
      action: "BUY",
      executedAt: new Date("2026-01-05T14:30:00.000Z"),
      quantity: "10",
      priceMinor: 18_750n,
      fees: {
        create: {
          id: "00000000-0000-4000-8000-000000000008",
          type: "COMMISSION",
          amountMinor: 50n,
          currency: "USD"
        }
      }
    }
  });

  await prisma.execution.upsert({
    where: { tradeId_sequence: { tradeId, sequence: 2 } },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000007",
      tradeId,
      sequence: 2,
      action: "SELL",
      executedAt: new Date("2026-01-05T19:45:00.000Z"),
      quantity: "10",
      priceMinor: 18_920n,
      fees: {
        create: {
          id: "00000000-0000-4000-8000-000000000009",
          type: "COMMISSION",
          amountMinor: 50n,
          currency: "USD"
        }
      }
    }
  });

  await prisma.subscription.upsert({
    where: { id: "00000000-0000-4000-8000-000000000004" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000004",
      userId,
      paymentProvider: "MANUAL",
      productCode: "rulivo-pro-monthly",
      status: "TRIALING",
      currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-02-01T00:00:00.000Z"),
      environment: "SANDBOX"
    }
  });
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
