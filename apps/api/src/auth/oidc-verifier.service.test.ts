import { beforeEach, describe, expect, it } from "vitest";
import { AuthConfig } from "./auth.config.js";
import { OidcVerifierService } from "./oidc-verifier.service.js";

describe("OidcVerifierService configuration boundaries", () => {
  beforeEach(() => {
    process.env.APP_ENV = "test";
    process.env.AUTH_JWT_SECRET = "test-only-auth-secret-with-at-least-32-characters";
    process.env.AUTH_EMAIL_DELIVERY_MODE = "debug";
    delete process.env.APPLE_CLIENT_IDS;
    delete process.env.GOOGLE_CLIENT_IDS;
  });

  it("fails closed when Apple client IDs are not configured", async () => {
    const verifier = new OidcVerifierService(new AuthConfig());
    await expect(verifier.verifyApple("invalid")).rejects.toMatchObject({ status: 503 });
  });

  it("does not expose Google sign-in in the China deployment", async () => {
    process.env.DEPLOYMENT_REGION = "CHINA";
    process.env.GOOGLE_CLIENT_IDS = "google-client";
    const verifier = new OidcVerifierService(new AuthConfig());
    await expect(verifier.verifyGoogle("invalid")).rejects.toMatchObject({ status: 503 });
  });
});
