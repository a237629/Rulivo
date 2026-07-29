import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "../database/prisma.service.js";

describe("behavior evidence invalidation", () => {
  let prisma: PrismaService;
  let tradeId: string;
  let userId: string;
  let instrumentId: string;
  const suffix = String(Date.now());

  beforeAll(async () => {
    process.env.DATABASE_URL = "postgresql://rulivo:rulivo@localhost:5432/rulivo?schema=public";
    prisma = new PrismaService();
    const user = await prisma.user.create({
      data: { email: `evidence-snapshot-${suffix}@example.com` }
    });
    userId = user.id;
    const account = await prisma.tradingAccount.create({
      data: { baseCurrency: "USD", name: "Evidence Test", userId }
    });
    const instrument = await prisma.instrument.create({
      data: {
        currency: "USD",
        market: "UNIT_TEST",
        symbol: `EV${suffix.slice(-8)}`
      }
    });
    instrumentId = instrument.id;
    const trade = await prisma.trade.create({
      data: {
        currency: "USD",
        entryPriceMinor: 100n,
        instrumentId,
        openedAt: new Date("2026-07-28T01:00:00Z"),
        quantity: "1",
        side: "LONG",
        symbol: instrument.symbol,
        tradingAccountId: account.id,
        userId
      }
    });
    tradeId = trade.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.instrument.deleteMany({ where: { id: instrumentId } });
    await prisma.$disconnect();
  });

  it("invalidates current evidence after source edits but not derived-score updates", async () => {
    const first = await prisma.behaviorEvidenceSnapshot.create({
      data: {
        algorithmVersion: "behavior-rules-v1",
        inputData: { tradeId },
        outputData: { status: "PASS" },
        patternType: "LOSS_REENTRY",
        sourceTradeUpdatedAt: new Date(),
        tradeId,
        userId
      }
    });
    await prisma.trade.update({
      data: {
        executionScore: 100,
        executionScoreCalculatedAt: new Date(),
        executionScoreVersion: "execution-score-v1"
      },
      where: { id: tradeId }
    });
    expect(
      (await prisma.behaviorEvidenceSnapshot.findUniqueOrThrow({ where: { id: first.id } }))
        .invalidatedAt
    ).toBeNull();

    await prisma.trade.update({ data: { quantity: "2" }, where: { id: tradeId } });
    const invalidated = await prisma.behaviorEvidenceSnapshot.findUniqueOrThrow({
      where: { id: first.id }
    });
    expect(invalidated.invalidatedAt).not.toBeNull();
    expect(invalidated.invalidationReason).toBe("TRADE_MODIFIED");
  });
});
