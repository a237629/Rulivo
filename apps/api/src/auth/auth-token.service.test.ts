import { beforeEach, describe, expect, it } from "vitest";
import { AuthConfig } from "./auth.config.js";
import { AuthTokenService } from "./auth-token.service.js";

describe("AuthTokenService", () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = "test-only-auth-secret-with-at-least-32-characters";
    process.env.AUTH_EMAIL_DELIVERY_MODE = "debug";
    process.env.APP_ENV = "test";
  });

  it("signs and verifies constrained access tokens", async () => {
    const service = new AuthTokenService(new AuthConfig());
    const token = await service.signAccessToken({ sessionId: "session-1", userId: "user-1" });

    await expect(service.verifyAccessToken(token)).resolves.toEqual({
      sessionId: "session-1",
      userId: "user-1"
    });
  });

  it("creates opaque refresh tokens and only exposes deterministic hashes", () => {
    const service = new AuthTokenService(new AuthConfig());
    const first = service.createRefreshToken();
    const second = service.createRefreshToken();

    expect(first.token).not.toBe(second.token);
    expect(first.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(service.hash(first.token)).toBe(first.hash);
  });
});
