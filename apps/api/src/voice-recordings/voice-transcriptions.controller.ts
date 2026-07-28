import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { VoiceTranscriptionsService } from "./voice-transcriptions.service.js";

const idSchema = z.uuid();
const confirmationSchema = z.object({ text: z.string().trim().min(1).max(100_000) }).strict();

@ApiTags("Voice transcriptions")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class VoiceTranscriptionsController {
  public constructor(private readonly transcriptions: VoiceTranscriptionsService) {}

  @Post("voice-recordings/:recordingId/transcribe")
  public create(@Req() request: AuthenticatedRequest, @Param("recordingId") recordingId: string) {
    if (!idSchema.safeParse(recordingId).success)
      throw new BadRequestException("Invalid recording ID");
    return this.transcriptions.create(request.auth.userId, recordingId);
  }

  @Get("voice-transcriptions/:transcriptionId")
  public get(
    @Req() request: AuthenticatedRequest,
    @Param("transcriptionId") transcriptionId: string
  ) {
    if (!idSchema.safeParse(transcriptionId).success)
      throw new BadRequestException("Invalid transcription ID");
    return this.transcriptions.get(request.auth.userId, transcriptionId);
  }

  @Post("voice-transcriptions/:transcriptionId/confirm")
  public confirm(
    @Req() request: AuthenticatedRequest,
    @Param("transcriptionId") transcriptionId: string,
    @Body() body: unknown
  ) {
    const id = idSchema.safeParse(transcriptionId);
    const confirmation = confirmationSchema.safeParse(body);
    if (!id.success || !confirmation.success)
      throw new BadRequestException("Confirmed transcription text is required");
    return this.transcriptions.confirm(request.auth.userId, id.data, confirmation.data.text);
  }
}
