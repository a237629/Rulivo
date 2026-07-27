import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../database/prisma.service.js";
import { AuthTokenService, type AccessClaims } from "./auth-token.service.js";

export interface AuthenticatedRequest extends Request {
  auth: AccessClaims;
}

@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(
    @Inject(AuthTokenService) private readonly tokens: AuthTokenService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer access token is required");
    }
    const claims = await this.tokens.verifyAccessToken(header.slice(7));
    const session = await this.prisma.authSession.findFirst({
      select: { id: true, user: { select: { status: true } } },
      where: {
        expiresAt: { gt: new Date() },
        id: claims.sessionId,
        revokedAt: null,
        userId: claims.userId
      }
    });
    if (session?.user.status !== "ACTIVE") {
      throw new UnauthorizedException("Session is no longer active");
    }
    request.auth = claims;
    return true;
  }
}
