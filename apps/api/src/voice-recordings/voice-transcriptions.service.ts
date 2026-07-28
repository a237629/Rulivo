import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { PrivateObjectStore } from "../images/private-object-store.js";
import { SpeechToTextService, TRANSCRIPTION_PROMPT_VERSION } from "./speech-to-text.service.js";

@Injectable()
export class VoiceTranscriptionsService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PrivateObjectStore) private readonly objects: PrivateObjectStore,
    @Inject(SpeechToTextService) private readonly speechToText: SpeechToTextService
  ) {}

  public async create(userId: string, recordingId: string) {
    const recording = await this.prisma.voiceRecording.findFirst({
      where: { id: recordingId, objectDeletedAt: null, userId },
      select: {
        id: true,
        mediaType: true,
        objectKey: true,
        transcription: { select: { id: true } }
      }
    });
    if (!recording) throw new NotFoundException("Voice recording not found");
    if (recording.transcription)
      throw new ConflictException("Voice recording is already transcribed");
    const candidateText = await this.speechToText.transcribe(
      await this.objects.read(recording.objectKey),
      recording.mediaType
    );
    return this.prisma.voiceTranscription.create({
      data: {
        candidateText,
        modelVersion: this.speechToText.modelVersion,
        promptVersion: TRANSCRIPTION_PROMPT_VERSION,
        voiceRecordingId: recording.id
      },
      select: {
        id: true,
        status: true,
        candidateText: true,
        modelVersion: true,
        promptVersion: true,
        createdAt: true
      }
    });
  }

  public async get(userId: string, transcriptionId: string) {
    const transcription = await this.prisma.voiceTranscription.findFirst({
      where: { id: transcriptionId, voiceRecording: { userId } },
      select: {
        id: true,
        status: true,
        candidateText: true,
        confirmedText: true,
        modelVersion: true,
        promptVersion: true,
        confirmedAt: true,
        createdAt: true,
        voiceRecording: { select: { objectDeletedAt: true } }
      }
    });
    if (!transcription) throw new NotFoundException("Voice transcription not found");
    return transcription;
  }

  public async confirm(userId: string, transcriptionId: string, confirmedText: string) {
    const transcription = await this.prisma.voiceTranscription.findFirst({
      where: { id: transcriptionId, voiceRecording: { userId } },
      select: {
        id: true,
        status: true,
        voiceRecording: { select: { id: true, objectKey: true } }
      }
    });
    if (!transcription) throw new NotFoundException("Voice transcription not found");
    if (transcription.status !== "CANDIDATE") {
      throw new ConflictException("Voice transcription is already confirmed");
    }
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { autoDeleteVoiceAfterTranscription: true }
    });
    const deleteOriginal = profile?.autoDeleteVoiceAfterTranscription ?? false;
    const confirmedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.voiceTranscription.update({
        where: { id: transcription.id },
        data: { confirmedAt, confirmedText, status: "CONFIRMED" }
      }),
      ...(deleteOriginal
        ? [
            this.prisma.voiceRecording.update({
              where: { id: transcription.voiceRecording.id },
              data: { objectDeletedAt: confirmedAt }
            })
          ]
        : [])
    ]);
    if (deleteOriginal) await this.objects.remove(transcription.voiceRecording.objectKey);
    return this.get(userId, transcription.id);
  }
}
