import { randomUUID } from "node:crypto";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { PrivateObjectStore } from "../images/private-object-store.js";
import { validateAudio } from "./audio-validation.js";

@Injectable()
export class VoiceRecordingsService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PrivateObjectStore) private readonly objects: PrivateObjectStore
  ) {}

  public async upload(
    userId: string,
    file: Express.Multer.File,
    durationMs: number,
    tradeId?: string
  ) {
    if (tradeId) {
      const trade = await this.prisma.trade.findFirst({
        where: { id: tradeId, userId },
        select: { id: true }
      });
      if (!trade) throw new NotFoundException("Trade not found");
    }
    let audio;
    try {
      audio = validateAudio(file.buffer, file.mimetype);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Invalid audio");
    }
    const id = randomUUID();
    const objectKey = `${userId}/${id}.${audio.extension}`;
    await this.objects.put(objectKey, file.buffer);
    try {
      return await this.prisma.voiceRecording.create({
        data: {
          id,
          durationMs,
          mediaType: audio.mediaType,
          objectKey,
          sizeBytes: file.buffer.length,
          tradeId: tradeId ?? null,
          userId
        },
        select: {
          id: true,
          tradeId: true,
          mediaType: true,
          sizeBytes: true,
          durationMs: true,
          createdAt: true
        }
      });
    } catch (error) {
      await this.objects.remove(objectKey);
      throw error;
    }
  }

  public async content(userId: string, recordingId: string) {
    const recording = await this.prisma.voiceRecording.findFirst({
      where: { id: recordingId, objectDeletedAt: null, userId },
      select: { mediaType: true, objectKey: true }
    });
    if (!recording) throw new NotFoundException("Voice recording not found");
    return {
      buffer: await this.objects.read(recording.objectKey),
      mediaType: recording.mediaType
    };
  }

  public async remove(userId: string, recordingId: string) {
    const recording = await this.prisma.voiceRecording.findFirst({
      where: { id: recordingId, userId },
      select: { id: true, objectKey: true }
    });
    if (!recording) throw new NotFoundException("Voice recording not found");
    await this.prisma.voiceRecording.delete({ where: { id: recording.id } });
    await this.objects.remove(recording.objectKey);
    return { deleted: true };
  }
}
