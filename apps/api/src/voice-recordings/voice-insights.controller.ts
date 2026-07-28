import { BadRequestException, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { VoiceInsightsService } from "./voice-insights.service.js";

const idSchema = z.uuid();

@ApiTags("Voice insights")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class VoiceInsightsController {
  public constructor(private readonly insights: VoiceInsightsService) {}

  @Post("voice-transcriptions/:transcriptionId/insights")
  public create(
    @Req() request: AuthenticatedRequest,
    @Param("transcriptionId") transcriptionId: string
  ) {
    if (!idSchema.safeParse(transcriptionId).success) {
      throw new BadRequestException("Invalid transcription ID");
    }
    return this.insights.create(request.auth.userId, transcriptionId);
  }

  @Get("voice-insights/:insightId")
  public get(@Req() request: AuthenticatedRequest, @Param("insightId") insightId: string) {
    if (!idSchema.safeParse(insightId).success) {
      throw new BadRequestException("Invalid insight ID");
    }
    return this.insights.get(request.auth.userId, insightId);
  }
}
