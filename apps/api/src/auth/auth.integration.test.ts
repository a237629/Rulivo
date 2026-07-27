import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { PrismaService } from "../database/prisma.service.js";

describe("email authentication lifecycle", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];
  const email = `step8-${String(Date.now())}@example.com`;

  beforeAll(async () => {
    process.env.APP_ENV = "test";
    process.env.DEPLOYMENT_REGION = "GLOBAL";
    process.env.AUTH_JWT_SECRET = "test-only-auth-secret-with-at-least-32-characters";
    process.env.AUTH_EMAIL_DELIVERY_MODE = "debug";
    process.env.DATABASE_URL = "postgresql://rulivo:rulivo@localhost:5432/rulivo?schema=public";
    app = await createApp({ logger: false });
    prisma = app.get(PrismaService);
    server = app.getHttpServer() as Parameters<typeof request>[0];
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.emailVerification.deleteMany({ where: { email } });
    await app.close();
  });

  it("issues, rotates and revokes a complete session", async () => {
    const requested = await request(server)
      .post("/auth/email/request-code")
      .send({ email })
      .expect(202);
    const code = (requested.body as { data: { debugCode: string } }).data.debugCode;
    expect(code).toMatch(/^\d{6}$/);
    await request(server).post("/auth/email/request-code").send({ email }).expect(429);

    const verified = await request(server)
      .post("/auth/email/verify")
      .send({ code, email })
      .expect(200);
    const first = (
      verified.body as {
        data: { accessToken: string; refreshToken: string; user: { email: string } };
      }
    ).data;
    expect(first.user.email).toBe(email);

    await request(server).get("/users/me/preferences").expect(401);
    const defaults = await request(server)
      .get("/users/me/preferences")
      .set("authorization", `Bearer ${first.accessToken}`)
      .expect(200);
    expect(defaults.body as unknown).toMatchObject({
      data: {
        defaultCurrency: "USD",
        defaultMarket: "UNITED_STATES",
        locale: "zh-CN",
        onboardingComplete: false,
        riskUnit: "PERCENT_OF_EQUITY",
        timeZone: "UTC"
      }
    });

    await request(server)
      .put("/users/me/preferences")
      .set("authorization", `Bearer ${first.accessToken}`)
      .send({
        defaultCurrency: "CNY",
        defaultMarket: "CHINA",
        locale: "zh-CN",
        riskUnit: "FIXED_AMOUNT",
        timeZone: "Asia/Shanghai"
      })
      .expect(200);
    const saved = await request(server)
      .get("/users/me/preferences")
      .set("authorization", `Bearer ${first.accessToken}`)
      .expect(200);
    expect(saved.body as unknown).toMatchObject({
      data: {
        defaultCurrency: "CNY",
        defaultMarket: "CHINA",
        onboardingComplete: true,
        riskUnit: "FIXED_AMOUNT",
        timeZone: "Asia/Shanghai"
      }
    });
    await request(server)
      .put("/users/me/preferences")
      .set("authorization", `Bearer ${first.accessToken}`)
      .send({
        defaultCurrency: "CNY",
        defaultMarket: "CHINA",
        locale: "zh-CN",
        riskUnit: "FIXED_AMOUNT",
        timeZone: "not/a-zone"
      })
      .expect(400);

    await request(server)
      .get("/auth/me")
      .set("authorization", `Bearer ${first.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body as unknown).toMatchObject({
          data: { roleAssignments: [{ role: "USER" }] }
        });
      });

    const refreshed = await request(server)
      .post("/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    const second = (
      refreshed.body as {
        data: { accessToken: string; refreshToken: string };
      }
    ).data;
    expect(second.refreshToken).not.toBe(first.refreshToken);

    await request(server)
      .post("/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(401);
    await request(server)
      .post("/auth/logout")
      .send({ refreshToken: second.refreshToken })
      .expect(204);
    await request(server)
      .get("/auth/me")
      .set("authorization", `Bearer ${second.accessToken}`)
      .expect(401);
  });

  it("rejects reuse of a consumed email code", async () => {
    const latest = await prisma.emailVerification.findFirstOrThrow({
      orderBy: { createdAt: "desc" },
      where: { email }
    });
    expect(latest.consumedAt).not.toBeNull();
    await request(server).post("/auth/email/verify").send({ code: "000000", email }).expect(401);
  });
});
