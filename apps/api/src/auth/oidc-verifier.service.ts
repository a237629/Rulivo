import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { AuthConfig } from "./auth.config.js";

export interface VerifiedOidcIdentity {
  email?: string;
  provider: "APPLE" | "GOOGLE";
  subject: string;
}

const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

@Injectable()
export class OidcVerifierService {
  public constructor(@Inject(AuthConfig) private readonly config: AuthConfig) {}

  public async verifyApple(idToken: string): Promise<VerifiedOidcIdentity> {
    if (this.config.appleClientIds.length === 0) {
      throw new ServiceUnavailableException("Sign in with Apple is not configured");
    }
    try {
      const { payload } = await jwtVerify(idToken, appleKeys, {
        algorithms: ["RS256"],
        audience: [...this.config.appleClientIds],
        issuer: "https://appleid.apple.com"
      });
      if (payload.sub === undefined) throw new Error("Missing subject");
      return {
        ...(typeof payload.email === "string" ? { email: payload.email.toLowerCase() } : {}),
        provider: "APPLE",
        subject: payload.sub
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new UnauthorizedException("Invalid Apple identity token");
    }
  }

  public async verifyGoogle(idToken: string): Promise<VerifiedOidcIdentity> {
    if (this.config.deploymentRegion !== "GLOBAL") {
      throw new ServiceUnavailableException("Google sign-in is unavailable in this region");
    }
    if (this.config.googleClientIds.length === 0) {
      throw new ServiceUnavailableException("Google sign-in is not configured");
    }
    try {
      const { payload } = await jwtVerify(idToken, googleKeys, {
        algorithms: ["RS256"],
        audience: [...this.config.googleClientIds],
        issuer: ["accounts.google.com", "https://accounts.google.com"]
      });
      if (
        payload.sub === undefined ||
        typeof payload.email !== "string" ||
        payload.email_verified !== true
      ) {
        throw new Error("Required Google claims are missing");
      }
      return {
        email: payload.email.toLowerCase(),
        provider: "GOOGLE",
        subject: payload.sub
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new UnauthorizedException("Invalid Google identity token");
    }
  }
}
