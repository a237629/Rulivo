import { Injectable } from "@nestjs/common";

function csv(value: string | undefined): readonly string[] {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0) ?? []
  );
}

@Injectable()
export class AuthConfig {
  public readonly accessTokenTtlSeconds = 15 * 60;
  public readonly refreshTokenTtlDays = 30;
  public readonly emailCodeTtlMinutes = 10;
  public readonly emailCodeResendSeconds = 60;
  public readonly emailCodeMaxAttempts = 5;
  public readonly issuer = "rulivo";
  public readonly audience = "rulivo-app";
  public readonly jwtSecret: string;
  public readonly deliveryMode: "debug" | "smtp";
  public readonly emailFrom: string;
  public readonly appleClientIds = csv(process.env.APPLE_CLIENT_IDS);
  public readonly googleClientIds = csv(process.env.GOOGLE_CLIENT_IDS);
  public readonly deploymentRegion = process.env.DEPLOYMENT_REGION ?? "GLOBAL";

  public constructor() {
    const secret = process.env.AUTH_JWT_SECRET;
    if (secret === undefined || secret.length < 32) {
      throw new Error("AUTH_JWT_SECRET must contain at least 32 characters.");
    }
    this.jwtSecret = secret;
    this.deliveryMode = process.env.AUTH_EMAIL_DELIVERY_MODE === "smtp" ? "smtp" : "debug";
    this.emailFrom = process.env.AUTH_EMAIL_FROM ?? "RULIVO <no-reply@rulivo.local>";

    if (process.env.APP_ENV === "production" && this.deliveryMode !== "smtp") {
      throw new Error("Production requires AUTH_EMAIL_DELIVERY_MODE=smtp.");
    }
  }
}
