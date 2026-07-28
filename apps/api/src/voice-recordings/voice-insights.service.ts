import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import {
  VOICE_INSIGHT_PROMPT_VERSION,
  VOICE_INSIGHT_SAFETY_BOUNDARY,
  VoiceInsightExtractor
} from "./voice-insight-extractor.service.js";

@Injectable()
export class VoiceInsightsService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(VoiceInsightExtractor) private readonly extractor: VoiceInsightExtractor
  ) {}

  public async create(userId: string, transcriptionId: string) {
    const transcription = await this.prisma.voiceTranscription.findFirst({
      where: { id: transcriptionId, status: "CONFIRMED", voiceRecording: { userId } },
      select: {
        id: true,
        confirmedText: true,
        insightExtraction: { select: { id: true } }
      }
    });
    if (!transcription?.confirmedText) {
      throw new NotFoundException("Confirmed voice transcription not found");
    }
    if (transcription.insightExtraction) {
      throw new ConflictException("Voice insights have already been extracted");
    }
    const extractedData = await this.extractor.extract(transcription.confirmedText);
    return this.prisma.voiceInsightExtraction.create({
      data: {
        extractedData,
        modelVersion: this.extractor.modelVersion,
        promptVersion: VOICE_INSIGHT_PROMPT_VERSION,
        safetyBoundary: VOICE_INSIGHT_SAFETY_BOUNDARY,
        voiceTranscriptionId: transcription.id
      },
      select: {
        id: true,
        extractedData: true,
        modelVersion: true,
        promptVersion: true,
        safetyBoundary: true,
        createdAt: true
      }
    });
  }

  public async get(userId: string, insightId: string) {
    const insight = await this.prisma.voiceInsightExtraction.findFirst({
      where: {
        id: insightId,
        voiceTranscription: { voiceRecording: { userId } }
      },
      select: {
        id: true,
        extractedData: true,
        modelVersion: true,
        promptVersion: true,
        safetyBoundary: true,
        createdAt: true
      }
    });
    if (!insight) throw new NotFoundException("Voice insights not found");
    return insight;
  }
}
