import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../database/prisma.service.js";
import { AuthConfig } from "./auth.config.js";
import { AuthTokenService } from "./auth-token.service.js";
import { EmailCodeSender } from "./email-code-sender.service.js";
import type { VerifiedOidcIdentity } from "./oidc-verifier.service.js";

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  tokenType: "Bearer";
  user: {
    email: string;
    id: string;
  };
}

@Injectable()
export class AuthService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthConfig) private readonly config: AuthConfig,
    @Inject(AuthTokenService) private readonly tokens: AuthTokenService,
    @Inject(EmailCodeSender) private readonly emailSender: EmailCodeSender
  ) {}

  public async requestEmailCode(emailInput: string): Promise<{ debugCode?: string }> {
    const email = emailInput.trim().toLowerCase();
    const latest = await this.prisma.emailVerification.findFirst({
      orderBy: { createdAt: "desc" },
      where: { email }
    });
    const resendAfter = new Date(Date.now() - this.config.emailCodeResendSeconds * 1000);
    if (latest !== null && latest.createdAt > resendAfter) {
      throw new HttpException(
        "Please wait before requesting another code",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const code = randomInt(100_000, 1_000_000).toString();
    await this.prisma.$transaction([
      this.prisma.emailVerification.updateMany({
        data: { consumedAt: new Date() },
        where: { consumedAt: null, email }
      }),
      this.prisma.emailVerification.create({
        data: {
          codeHash: this.hashEmailCode(email, code),
          email,
          expiresAt: new Date(Date.now() + this.config.emailCodeTtlMinutes * 60_000)
        }
      })
    ]);
    await this.emailSender.send(email, code);

    return this.config.deliveryMode === "debug" ? { debugCode: code } : {};
  }

  public async verifyEmailCode(emailInput: string, code: string): Promise<AuthResult> {
    const email = emailInput.trim().toLowerCase();
    const verification = await this.prisma.emailVerification.findFirst({
      orderBy: { createdAt: "desc" },
      where: { consumedAt: null, email }
    });
    if (
      verification === null ||
      verification.expiresAt <= new Date() ||
      verification.attempts >= this.config.emailCodeMaxAttempts
    ) {
      throw new UnauthorizedException("Invalid or expired verification code");
    }

    if (!this.safeEqual(verification.codeHash, this.hashEmailCode(email, code))) {
      await this.prisma.emailVerification.update({
        data: { attempts: { increment: 1 } },
        where: { id: verification.id }
      });
      throw new UnauthorizedException("Invalid or expired verification code");
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerification.updateMany({
        data: { consumedAt: new Date() },
        where: { consumedAt: null, id: verification.id }
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException("Verification code has already been used");
      }
      const savedUser = await tx.user.upsert({
        create: { email },
        update: {},
        where: { email }
      });
      await tx.userRoleAssignment.upsert({
        create: { role: "USER", userId: savedUser.id },
        update: {},
        where: { userId_role: { role: "USER", userId: savedUser.id } }
      });
      await tx.authIdentity.upsert({
        create: {
          email,
          provider: "EMAIL",
          providerSubject: email,
          userId: savedUser.id
        },
        update: { email },
        where: {
          provider_providerSubject: {
            provider: "EMAIL",
            providerSubject: email
          }
        }
      });
      return savedUser;
    });
    return this.issueSession(user.id, user.email);
  }

  public async authenticateOidc(identity: VerifiedOidcIdentity): Promise<AuthResult> {
    const existing = await this.prisma.authIdentity.findUnique({
      include: { user: true },
      where: {
        provider_providerSubject: {
          provider: identity.provider,
          providerSubject: identity.subject
        }
      }
    });
    if (existing !== null) {
      return this.issueSession(existing.user.id, existing.user.email);
    }
    if (identity.email === undefined) {
      throw new BadRequestException("Email is required for the first provider sign-in");
    }
    const email = identity.email;

    const user = await this.prisma.$transaction(async (tx) => {
      const savedUser = await tx.user.upsert({
        create: { email },
        update: {},
        where: { email }
      });
      await tx.userRoleAssignment.upsert({
        create: { role: "USER", userId: savedUser.id },
        update: {},
        where: { userId_role: { role: "USER", userId: savedUser.id } }
      });
      await tx.authIdentity.create({
        data: {
          email,
          provider: identity.provider,
          providerSubject: identity.subject,
          userId: savedUser.id
        }
      });
      return savedUser;
    });
    return this.issueSession(user.id, user.email);
  }

  public async refresh(refreshToken: string): Promise<AuthResult> {
    const oldHash = this.tokens.hash(refreshToken);
    const next = this.tokens.createRefreshToken();
    const session = await this.prisma.$transaction(async (tx) => {
      const current = await tx.authSession.findUnique({
        include: { user: true },
        where: { refreshTokenHash: oldHash }
      });
      if (current === null) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }
      if (current.revokedAt !== null || current.expiresAt <= new Date()) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }
      const replacement = await tx.authSession.create({
        data: {
          expiresAt: this.refreshExpiry(),
          refreshTokenHash: next.hash,
          userId: current.userId
        }
      });
      const revoked = await tx.authSession.updateMany({
        data: {
          lastUsedAt: new Date(),
          replacedById: replacement.id,
          revokedAt: new Date()
        },
        where: { id: current.id, revokedAt: null }
      });
      if (revoked.count !== 1) {
        throw new UnauthorizedException("Refresh token has already been used");
      }
      return { replacement, user: current.user };
    });
    return this.authResult(session.user.id, session.user.email, session.replacement.id, next.token);
  }

  public async logout(refreshToken: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      data: { revokedAt: new Date() },
      where: {
        refreshTokenHash: this.tokens.hash(refreshToken),
        revokedAt: null
      }
    });
  }

  private async issueSession(userId: string, email: string): Promise<AuthResult> {
    const refresh = this.tokens.createRefreshToken();
    const session = await this.prisma.authSession.create({
      data: {
        expiresAt: this.refreshExpiry(),
        refreshTokenHash: refresh.hash,
        userId
      }
    });
    return this.authResult(userId, email, session.id, refresh.token);
  }

  private async authResult(
    userId: string,
    email: string,
    sessionId: string,
    refreshToken: string
  ): Promise<AuthResult> {
    return {
      accessToken: await this.tokens.signAccessToken({ sessionId, userId }),
      expiresIn: this.config.accessTokenTtlSeconds,
      refreshToken,
      tokenType: "Bearer",
      user: { email, id: userId }
    };
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.config.refreshTokenTtlDays * 86_400_000);
  }

  private hashEmailCode(email: string, code: string): string {
    return createHmac("sha256", this.config.jwtSecret).update(`${email}:${code}`).digest("hex");
  }

  private safeEqual(left: string, right: string): boolean {
    return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
  }
}
