import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("API foundation", () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];

  beforeAll(async () => {
    process.env.APP_ENV = "test";
    process.env.DEPLOYMENT_REGION = "GLOBAL";
    process.env.AUTH_JWT_SECRET = "test-only-auth-secret-with-at-least-32-characters";
    process.env.AUTH_EMAIL_DELIVERY_MODE = "debug";
    process.env.DATABASE_URL = "postgresql://rulivo:rulivo@localhost:5432/rulivo?schema=public";
    app = await createApp({ logger: false });
    server = app.getHttpServer() as Parameters<typeof request>[0];
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns a wrapped health response with a generated request ID", async () => {
    const response = await request(server).get("/health").expect(200);

    expect(response.headers["x-request-id"]).toEqual(expect.any(String));
    expect(response.body as unknown).toMatchObject({
      data: {
        service: "rulivo-api",
        status: "ok"
      },
      meta: {
        requestId: response.headers["x-request-id"]
      },
      success: true
    });
  });

  it("preserves a valid caller request ID", async () => {
    const response = await request(server)
      .get("/health")
      .set("x-request-id", "integration-test-request")
      .expect(200);

    expect(response.headers["x-request-id"]).toBe("integration-test-request");
    const body = response.body as { meta: { requestId: string } };
    expect(body.meta.requestId).toBe("integration-test-request");
  });

  it("uses the unified error envelope and stable code", async () => {
    const response = await request(server).get("/missing").expect(404);

    expect(response.body as unknown).toMatchObject({
      error: {
        code: "NOT_FOUND"
      },
      success: false
    });
    const body = response.body as { meta: { requestId: string } };
    expect(body.meta.requestId).toBe(response.headers["x-request-id"]);
  });

  it("publishes OpenAPI JSON", async () => {
    const response = await request(server).get("/docs-json").expect(200);

    const body = response.body as {
      info: { title: string };
      paths: Record<string, unknown>;
    };
    expect(body.info.title).toBe("RULIVO API");
    expect(body.paths).toHaveProperty("/health");
    expect(body.paths).toHaveProperty("/users/me/preferences");
    expect(body.paths).toHaveProperty("/admin/users/{userId}/roles");
    expect(body.paths).toHaveProperty("/admin/audit-logs");
  });
});
