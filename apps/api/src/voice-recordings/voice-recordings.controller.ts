import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { MAX_AUDIO_BYTES } from "./audio-validation.js";
import { VoiceRecordingsService } from "./voice-recordings.service.js";

const idSchema = z.uuid();
const uploadSchema = z.object({
  durationMs: z.coerce.number().int().min(1).max(3_600_000),
  tradeId: z.uuid().optional()
});

@ApiTags("Voice recordings")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("voice-recordings")
export class VoiceRecordingsController {
  public constructor(private readonly recordings: VoiceRecordingsService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_AUDIO_BYTES, files: 1 } }))
  public upload(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined
  ) {
    const parsed = uploadSchema.safeParse(request.body);
    if (!file || !parsed.success) throw new BadRequestException("Audio and duration are required");
    return this.recordings.upload(
      request.auth.userId,
      file,
      parsed.data.durationMs,
      parsed.data.tradeId
    );
  }

  @Get(":recordingId/content")
  @Header("Cache-Control", "private, no-store")
  public async content(
    @Req() request: AuthenticatedRequest,
    @Param("recordingId") recordingId: string
  ) {
    if (!idSchema.safeParse(recordingId).success)
      throw new BadRequestException("Invalid recording ID");
    const audio = await this.recordings.content(request.auth.userId, recordingId);
    return new StreamableFile(audio.buffer, {
      type: audio.mediaType,
      disposition: "inline",
      length: audio.buffer.length
    });
  }

  @Delete(":recordingId")
  public remove(@Req() request: AuthenticatedRequest, @Param("recordingId") recordingId: string) {
    if (!idSchema.safeParse(recordingId).success)
      throw new BadRequestException("Invalid recording ID");
    return this.recordings.remove(request.auth.userId, recordingId);
  }
}
