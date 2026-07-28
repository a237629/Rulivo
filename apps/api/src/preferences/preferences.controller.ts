import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Put,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { preferencesSchema } from "./preference-validation.js";
import { PreferencesService } from "./preferences.service.js";

const voiceRetentionSchema = z.object({ autoDeleteVoiceAfterTranscription: z.boolean() }).strict();

@ApiTags("preferences")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("users/me/preferences")
export class PreferencesController {
  public constructor(
    @Inject(PreferencesService) private readonly preferences: PreferencesService
  ) {}

  @Get()
  public async get(@Req() request: AuthenticatedRequest) {
    return this.preferences.get(request.auth.userId);
  }

  @Put()
  public async save(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }
    return this.preferences.save(request.auth.userId, parsed.data);
  }

  @Put("voice-retention")
  public async saveVoiceRetention(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = voiceRetentionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid voice retention preference");
    return this.preferences.saveVoiceRetention(
      request.auth.userId,
      parsed.data.autoDeleteVoiceAfterTranscription
    );
  }
}
