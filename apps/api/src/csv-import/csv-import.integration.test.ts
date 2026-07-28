import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { PrismaService } from "../database/prisma.service.js";

describe("CSV import lifecycle", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];
  let accessToken: string;
  let userId: string;
  let accountId: string;
  let batchId: string;
  let statisticsInstrumentId: string | undefined;
  const suffix = String(Date.now());
  const email = `csv-import-${suffix}@example.com`;
  const content = [
    "Time,Ticker,Side,Qty,Price,Commission",
    "2026-01-05T14:30:00Z,AAPL,BUY,0.5,187.50,1.25",
    "bad-date,MSFT,HOLD,0,410.999,-1"
  ].join("\n");

  beforeAll(async () => {
    process.env.APP_ENV = "test";
    process.env.DEPLOYMENT_REGION = "GLOBAL";
    process.env.AUTH_JWT_SECRET = "test-only-auth-secret-with-at-least-32-characters";
    process.env.AUTH_EMAIL_DELIVERY_MODE = "debug";
    process.env.DATABASE_URL = "postgresql://rulivo:rulivo@localhost:5432/rulivo?schema=public";
    app = await createApp({ logger: false });
    prisma = app.get(PrismaService);
    server = app.getHttpServer() as Parameters<typeof request>[0];

    const requested = await request(server)
      .post("/auth/email/request-code")
      .send({ email })
      .expect(202);
    const code = (requested.body as { data: { debugCode: string } }).data.debugCode;
    const verified = await request(server)
      .post("/auth/email/verify")
      .send({ code, email })
      .expect(200);
    const authData = (verified.body as { data: { accessToken: string; user: { id: string } } })
      .data;
    accessToken = authData.accessToken;
    userId = authData.user.id;

    const account = await prisma.tradingAccount.create({
      data: { baseCurrency: "USD", name: "CSV Test", userId }
    });
    accountId = account.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.emailVerification.deleteMany({ where: { email } });
    if (statisticsInstrumentId !== undefined) {
      await prisma.instrument.deleteMany({ where: { id: statisticsInstrumentId } });
    }
    await app.close();
  });

  it("uploads, previews, maps errors and saves a template", async () => {
    const uploaded = await request(server)
      .post("/imports/csv/upload")
      .set("authorization", `Bearer ${accessToken}`)
      .send({ content, fileName: "executions.csv", tradingAccountId: accountId })
      .expect(201);
    const uploadData = uploaded.body as {
      data: {
        headers: string[];
        id: string;
        preview: unknown[];
        status: string;
        totalRows: number;
      };
    };
    batchId = uploadData.data.id;
    expect(uploadData.data).toMatchObject({
      headers: ["Time", "Ticker", "Side", "Qty", "Price", "Commission"],
      status: "UPLOADED",
      totalRows: 2
    });
    expect(uploadData.data.preview).toHaveLength(2);

    const mapped = await request(server)
      .put(`/imports/csv/${batchId}/mapping`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        mapping: {
          action: "Side",
          executedAt: "Time",
          fee: "Commission",
          price: "Price",
          quantity: "Qty",
          symbol: "Ticker"
        },
        options: { defaultCurrency: "USD", defaultMarket: "NASDAQ", priceScale: 2 },
        saveTemplate: { name: "My broker" }
      })
      .expect(200);
    expect(mapped.body as unknown).toMatchObject({
      data: {
        errorRows: 1,
        status: "MAPPED",
        validRows: 1
      }
    });
    const mappedData = mapped.body as { data: { errorPreview: unknown[] } };
    expect(mappedData.data.errorPreview).toHaveLength(1);

    const templates = await request(server)
      .get("/imports/csv/mapping-templates")
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(templates.body as unknown).toMatchObject({
      data: [{ name: "My broker" }]
    });
  });

  it("detects duplicate content and confirms only normalized valid rows", async () => {
    const duplicate = await request(server)
      .post("/imports/csv/upload")
      .set("authorization", `Bearer ${accessToken}`)
      .send({ content, fileName: "renamed.csv", tradingAccountId: accountId })
      .expect(409);
    expect(duplicate.body as unknown).toMatchObject({
      error: { details: { duplicateBatchId: batchId } }
    });

    const confirmed = await request(server)
      .post(`/imports/csv/${batchId}/confirm`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(201);
    expect(confirmed.body as unknown).toMatchObject({
      data: { errorRows: 1, status: "CONFIRMED", validRows: 1 }
    });

    const validRow = await prisma.csvImportRow.findFirstOrThrow({
      where: { batchId, isValid: true }
    });
    expect(validRow.normalizedData).toMatchObject({
      action: "BUY",
      feeMinor: "125",
      priceMinor: "18750",
      quantity: "0.5",
      symbol: "AAPL"
    });

    const grouped = await request(server)
      .post(`/imports/csv/${batchId}/group`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(201);
    expect(grouped.body as unknown).toMatchObject({
      data: {
        alreadyGrouped: false,
        executionCount: 1,
        tradeCount: 1
      }
    });
    const importedTrade = await prisma.trade.findFirstOrThrow({
      include: { executions: { include: { importSource: true } }, fees: true },
      where: { importBatchId: batchId }
    });
    expect(importedTrade).toMatchObject({
      side: "LONG",
      source: "CSV",
      status: "OPEN",
      symbol: "AAPL"
    });
    expect(importedTrade.executions[0]?.importSource?.csvImportRowId).toBe(validRow.id);
    expect(importedTrade.fees[0]?.amountMinor).toBe(125n);

    const analytics = await request(server)
      .put(`/trades/${importedTrade.id}/analytics`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ initialRiskMinor: "100" })
      .expect(200);
    expect(analytics.body as unknown).toMatchObject({
      data: {
        feesMinor: "125",
        grossPnlMinor: "0",
        initialRiskMinor: "100",
        netPnlMinor: "-125",
        rMultiple: "-1.250000",
        tradeId: importedTrade.id
      }
    });
    const calculatedTrade = await prisma.trade.findUniqueOrThrow({
      where: { id: importedTrade.id }
    });
    expect(calculatedTrade.realizedPnlMinor).toBe(-125n);
    expect(calculatedTrade.initialRiskMinor).toBe(100n);
    expect(calculatedTrade.rMultiple?.toFixed()).toBe("-1.25");
    expect(calculatedTrade.analyticsCalculatedAt).not.toBeNull();

    const repeated = await request(server)
      .post(`/imports/csv/${batchId}/group`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(201);
    expect(repeated.body as unknown).toMatchObject({
      data: { alreadyGrouped: true, tradeCount: 1 }
    });
    expect(await prisma.trade.count({ where: { importBatchId: batchId } })).toBe(1);

    await request(server)
      .put(`/imports/csv/${batchId}/mapping`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        mapping: {
          action: "Side",
          executedAt: "Time",
          price: "Price",
          quantity: "Qty",
          symbol: "Ticker"
        }
      })
      .expect(409);
  });

  it("detects and applies the Interactive Brokers preset", async () => {
    const ibkrContent = [
      "Date/Time,Symbol,Buy/Sell,T. Price,Quantity,Comm/Fee,Currency,Exec. ID",
      "2026-02-03T15:45:00Z,MSFT,BOT,410.1250,3,1.2500,USD,exec-1"
    ].join("\n");
    const uploaded = await request(server)
      .post("/imports/csv/upload")
      .set("authorization", `Bearer ${accessToken}`)
      .send({ content: ibkrContent, fileName: "ibkr.csv", tradingAccountId: accountId })
      .expect(201);
    const ibkrBatchId = (uploaded.body as { data: { id: string } }).data.id;

    const presets = await request(server)
      .get("/imports/csv/presets")
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect((presets.body as { data: unknown[] }).data).toHaveLength(5);

    const detected = await request(server)
      .post(`/imports/csv/${ibkrBatchId}/detect-preset`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(201);
    expect(detected.body as unknown).toMatchObject({
      data: { detected: true, preset: { id: "INTERACTIVE_BROKERS" } }
    });

    const applied = await request(server)
      .put(`/imports/csv/${ibkrBatchId}/preset`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ presetId: "INTERACTIVE_BROKERS" })
      .expect(200);
    expect(applied.body as unknown).toMatchObject({
      data: {
        errorRows: 0,
        presetId: "INTERACTIVE_BROKERS",
        status: "MAPPED",
        validRows: 1
      }
    });
    const normalized = await prisma.csvImportRow.findFirstOrThrow({
      where: { batchId: ibkrBatchId }
    });
    expect(normalized.normalizedData).toMatchObject({
      action: "BUY",
      feeMinor: "12500",
      priceMinor: "4101250"
    });
  });

  it("returns user-scoped core statistics grouped by currency and local time", async () => {
    const symbol = `STAT${suffix.slice(-8)}`;
    const instrument = await prisma.instrument.create({
      data: {
        currency: "USD",
        market: "TEST",
        symbol
      }
    });
    statisticsInstrumentId = instrument.id;
    const results = [300n, -100n, -100n];
    const closedTimes = [
      new Date("2026-01-05T01:00:00Z"),
      new Date("2026-01-06T02:00:00Z"),
      new Date("2026-01-07T03:00:00Z")
    ];
    for (const [index, realizedPnlMinor] of results.entries()) {
      const closedAt = closedTimes[index];
      if (closedAt === undefined) throw new Error("Missing statistics fixture timestamp");
      await prisma.trade.create({
        data: {
          analyticsCalculatedAt: closedAt,
          closedAt,
          currency: "USD",
          entryPriceMinor: 10_000n,
          exitPriceMinor: 10_100n,
          instrumentId: instrument.id,
          market: "TEST",
          openedAt: new Date(closedAt.valueOf() - 60_000),
          quantity: "1",
          realizedPnlMinor,
          side: "LONG",
          source: "MANUAL",
          status: "CLOSED",
          symbol,
          tradingAccountId: accountId,
          userId
        }
      });
    }

    const response = await request(server)
      .get("/analytics/core")
      .query({
        from: "2026-01-01T00:00:00Z",
        timeZone: "Asia/Shanghai",
        to: "2026-02-01T00:00:00Z",
        tradingAccountId: accountId
      })
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(response.body as unknown).toMatchObject({
      data: {
        currencies: [
          {
            currency: "USD",
            grossLossMinor: "200",
            grossProfitMinor: "300",
            losses: 2,
            maxConsecutiveLosses: 2,
            maxConsecutiveWins: 1,
            maxDrawdownMinor: "200",
            netPnlMinor: "100",
            profitFactor: "1.500000",
            sampleSize: 3,
            winRate: "0.333333",
            wins: 1
          }
        ],
        timeZone: "Asia/Shanghai",
        totalSampleSize: 3
      }
    });
    const body = response.body as {
      data: { currencies: { hourly: Record<string, { sampleSize: number }> }[] };
    };
    expect(body.data.currencies[0]?.hourly["09"]?.sampleSize).toBe(1);
  });

  it("evaluates and persists all five behavior rules without guessing missing evidence", async () => {
    if (statisticsInstrumentId === undefined) throw new Error("Statistics fixture is missing");
    const playbookResponse = await request(server)
      .post("/playbooks")
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        lossReentryMinutes: 30,
        maxDailyTrades: 2,
        name: `Rules ${suffix}`,
        positionIncreasePercent: 50
      })
      .expect(201);
    const playbookId = (playbookResponse.body as { data: { id: string } }).data.id;
    const times = [
      ["2026-01-08T08:00:00Z", "2026-01-08T08:10:00Z", 10n],
      ["2026-01-08T09:00:00Z", "2026-01-08T09:10:00Z", 10n],
      ["2026-01-08T09:40:00Z", "2026-01-08T10:00:00Z", -100n]
    ] as const;
    for (const [openedAt, closedAt, realizedPnlMinor] of times) {
      await prisma.trade.create({
        data: {
          closedAt: new Date(closedAt),
          currency: "USD",
          entryPriceMinor: 100n,
          exitPriceMinor: 100n,
          instrumentId: statisticsInstrumentId,
          market: "TEST",
          openedAt: new Date(openedAt),
          quantity: "1",
          realizedPnlMinor,
          side: "LONG",
          status: "CLOSED",
          symbol: `STAT${suffix.slice(-8)}`,
          tradingAccountId: accountId,
          userId
        }
      });
    }
    const target = await prisma.trade.create({
      data: {
        currency: "USD",
        entryPriceMinor: 100n,
        instrumentId: statisticsInstrumentId,
        market: "TEST",
        openedAt: new Date("2026-01-08T10:20:00Z"),
        quantity: "2",
        side: "LONG",
        status: "OPEN",
        symbol: `STAT${suffix.slice(-8)}`,
        tradingAccountId: accountId,
        userId
      }
    });
    await request(server)
      .put(`/trades/${target.id}/playbook`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ playbookId })
      .expect(200);

    const evaluated = await request(server)
      .post(`/trades/${target.id}/rules/evaluate`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ playbookId })
      .expect(201);
    const results = (
      evaluated.body as {
        data: { evidenceType: string; status: string }[];
      }
    ).data;
    expect(results.map(({ status }) => status).sort()).toEqual(
      ["FAIL", "FAIL", "FAIL", "PASS", "UNKNOWN"].sort()
    );
    expect(results).toContainEqual(
      expect.objectContaining({ evidenceType: "MISSING_DATA", status: "UNKNOWN" })
    );

    const stopEvent = await request(server)
      .post(`/trades/${target.id}/stop-events`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        newStopPriceMinor: "90",
        occurredAt: "2026-01-08T10:21:00Z",
        previousStopPriceMinor: "95"
      })
      .expect(201);
    const stopEventId = (stopEvent.body as { data: { id: string } }).data.id;
    await request(server)
      .post(`/trades/${target.id}/rules/evaluate`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ playbookId })
      .expect(201);
    expect(await prisma.tradeRuleResult.count({ where: { tradeId: target.id } })).toBe(5);

    const listed = await request(server)
      .get(`/trades/${target.id}/rule-results`)
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);
    const listedResults = (
      listed.body as {
        data: {
          evidenceId: string | null;
          playbookRule: { type: string };
          status: string;
        }[];
      }
    ).data;
    expect(listedResults).toHaveLength(5);
    expect(listedResults).toContainEqual(
      expect.objectContaining({
        evidenceId: stopEventId,
        playbookRule: { type: "MOVED_STOP" },
        status: "FAIL"
      })
    );
  });
});
