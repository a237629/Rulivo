import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { PrismaService } from "../database/prisma.service.js";
import { AuthGuard, type AuthenticatedRequest } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";
import { OidcVerifierService } from "./oidc-verifier.service.js";

const emailSchema = z.object({ email: z.email().max(320) }).strict();
const verifyEmailSchema = emailSchema.extend({ code: z.string().regex(/^\d{6}$/) }).strict();
const tokenSchema = z.object({ idToken: z.string().min(1).max(16_384) }).strict();
const refreshSchema = z.object({ refreshToken: z.string().min(32).max(1_024) }).strict();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.issues.map((issue) => issue.message));
  }
  return result.data;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  public constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(OidcVerifierService) private readonly oidc: OidcVerifierService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Post("email/request-code")
  @HttpCode(202)
  public async requestEmailCode(@Body() body: unknown): Promise<{
    debugCode?: string;
    message: string;
  }> {
    const { email } = parse(emailSchema, body);
    return {
      ...(await this.auth.requestEmailCode(email)),
      message: "If the address can receive email, a verification code has been sent"
    };
  }

  @Post("email/verify")
  @HttpCode(200)
  public async verifyEmail(@Body() body: unknown) {
    const { code, email } = parse(verifyEmailSchema, body);
    return this.auth.verifyEmailCode(email, code);
  }

  @Post("apple")
  @HttpCode(200)
  public async apple(@Body() body: unknown) {
    const { idToken } = parse(tokenSchema, body);
    return this.auth.authenticateOidc(await this.oidc.verifyApple(idToken));
  }

  @Post("google")
  @HttpCode(200)
  public async google(@Body() body: unknown) {
    const { idToken } = parse(tokenSchema, body);
    return this.auth.authenticateOidc(await this.oidc.verifyGoogle(idToken));
  }

  @Post("refresh")
  @HttpCode(200)
  public async refresh(@Body() body: unknown) {
    return this.auth.refresh(parse(refreshSchema, body).refreshToken);
  }

  @Post("logout")
  @HttpCode(204)
  public async logout(@Body() body: unknown): Promise<void> {
    await this.auth.logout(parse(refreshSchema, body).refreshToken);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  public async me(@Req() request: AuthenticatedRequest) {
    return this.prisma.user.findUniqueOrThrow({
      select: {
        email: true,
        id: true,
        roleAssignments: { orderBy: { role: "asc" }, select: { role: true } },
        status: true
      },
      where: { id: request.auth.userId }
    });
  }
}
