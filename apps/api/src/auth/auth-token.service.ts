import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { AuthConfig } from "./auth.config.js";

export interface AccessClaims {
  sessionId: string;
  userId: string;
}

@Injectable()
export class AuthTokenService {
  private readonly key: Uint8Array;

  public constructor(@Inject(AuthConfig) private readonly config: AuthConfig) {
    this.key = new TextEncoder().encode(config.jwtSecret);
  }

  public async signAccessToken(claims: AccessClaims): Promise<string> {
    return new SignJWT({ sid: claims.sessionId })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(claims.userId)
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .setIssuedAt()
      .setExpirationTime(`${String(this.config.accessTokenTtlSeconds)}s`)
      .sign(this.key);
  }

  public async verifyAccessToken(token: string): Promise<AccessClaims> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: ["HS256"],
        audience: this.config.audience,
        issuer: this.config.issuer
      });
      if (payload.sub === undefined || typeof payload.sid !== "string") {
        throw new Error("Missing claims");
      }
      return { sessionId: payload.sid, userId: payload.sub };
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  public createRefreshToken(): { hash: string; token: string } {
    const token = randomBytes(32).toString("base64url");
    return { hash: this.hash(token), token };
  }

  public hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}
