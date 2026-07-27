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

  await prisma.trade.upsert({
    where: { id: "00000000-0000-4000-8000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      userId,
      tradingAccountId: accountId,
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
