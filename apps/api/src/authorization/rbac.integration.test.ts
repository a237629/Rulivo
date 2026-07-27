import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { PrismaService } from "../database/prisma.service.js";

describe("role management and immutable audit", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];
  let accessToken: string;
  let adminUserId: string;
  let targetUserId: string;
  const suffix = String(Date.now());
  const adminEmail = `rbac-admin-${suffix}@example.com`;
  const targetEmail = `rbac-target-${suffix}@example.com`;
  const requestId = `rbac-test-${suffix}`;

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
      .send({ email: adminEmail })
      .expect(202);
    const code = (requested.body as { data: { debugCode: string } }).data.debugCode;
    const verified = await request(server)
      .post("/auth/email/verify")
      .send({ code, email: adminEmail })
      .expect(200);
    const data = (verified.body as { data: { accessToken: string; user: { id: string } } }).data;
    accessToken = data.accessToken;
    adminUserId = data.user.id;

    const target = await prisma.user.create({
      data: {
        email: targetEmail,
        roleAssignments: { create: { role: "USER" } }
      }
    });
    targetUserId = target.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, targetEmail] } } });
    await prisma.emailVerification.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it("denies a baseline user, then atomically records an admin role change", async () => {
    await request(server)
      .put(`/admin/users/${targetUserId}/roles`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ roles: ["USER", "SUPPORT"] })
      .expect(403);

    await prisma.userRoleAssignment.create({
      data: { role: "ADMIN", userId: adminUserId }
    });
    const changed = await request(server)
      .put(`/admin/users/${targetUserId}/roles`)
      .set("authorization", `Bearer ${accessToken}`)
      .set("x-request-id", requestId)
      .send({ roles: ["USER", "SUPPORT", "ANALYST"] })
      .expect(200);
    expect(changed.body as unknown).toMatchObject({
      data: { id: targetUserId, roles: ["ANALYST", "SUPPORT", "USER"] }
    });

    const audit = await prisma.auditLog.findFirstOrThrow({ where: { requestId } });
    expect(audit).toMatchObject({
      action: "USER_ROLES_REPLACED",
      actorEmail: adminEmail,
      targetIdentifier: targetEmail
    });
    expect(audit.metadata).toEqual({
      after: ["ANALYST", "SUPPORT", "USER"],
      before: ["USER"]
    });

    await expect(
      prisma.auditLog.update({
        data: { action: "TAMPERED" },
        where: { id: audit.id }
      })
    ).rejects.toThrow();
  });

  it("prevents administrators from removing their own ADMIN role", async () => {
    await request(server)
      .put(`/admin/users/${adminUserId}/roles`)
      .set("authorization", `Bearer ${accessToken}`)
      .send({ roles: ["USER"] })
      .expect(400);
  });
});
