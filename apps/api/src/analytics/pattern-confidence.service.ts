import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";

@Injectable()
export class PatternConfidenceService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async get(userId: string) {
    const metrics = await this.prisma.behaviorPatternConfidence.findMany({
      orderBy: { patternType: "asc" },
      select: {
        algorithmVersion: true,
        calculatedAt: true,
        confidenceScore: true,
        counterexampleCount: true,
        dataCompleteness: true,
        dominantStatus: true,
        effectSize: true,
        failCount: true,
        knownSampleSize: true,
        level: true,
        passCount: true,
        patternType: true,
        sampleSize: true,
        sourceRunId: true,
        unknownCount: true
      },
      where: { userId }
    });
    return metrics.map((metric) => ({
      ...metric,
      dataCompleteness: metric.dataCompleteness.toNumber(),
      effectSize: metric.effectSize.toNumber()
    }));
  }
}
