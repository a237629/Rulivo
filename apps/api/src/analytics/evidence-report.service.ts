import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { buildEvidenceReport, type EvidenceReportSnapshot } from "./evidence-report.js";
import { patternExplanationOutputSchema } from "./pattern-explanation.contract.js";
import { PatternExplanationService } from "./pattern-explanation.service.js";

function snapshotStatus(value: unknown): EvidenceReportSnapshot["status"] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "UNKNOWN";
  const status = (value as { status?: unknown }).status;
  return status === "PASS" || status === "FAIL" ? status : "UNKNOWN";
}

@Injectable()
export class EvidenceReportService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PatternExplanationService)
    private readonly explanations: PatternExplanationService
  ) {}

  public async get(userId: string) {
    const [storedExplanation, metrics, snapshots] = await Promise.all([
      this.explanations.get(userId),
      this.prisma.behaviorPatternConfidence.findMany({
        orderBy: { patternType: "asc" },
        where: { userId }
      }),
      this.prisma.behaviorEvidenceSnapshot.findMany({
        orderBy: [{ patternType: "asc" }, { trade: { openedAt: "desc" } }],
        select: {
          id: true,
          outputData: true,
          patternType: true,
          trade: {
            select: { id: true, openedAt: true, symbol: true }
          }
        },
        where: { invalidatedAt: null, userId }
      })
    ]);
    if (storedExplanation === null) {
      throw new NotFoundException("A current pattern explanation is required");
    }
    const explanation = patternExplanationOutputSchema.parse(storedExplanation.output);
    return {
      explanationId: storedExplanation.id,
      ...buildEvidenceReport(
        metrics.map((metric) => ({
          algorithmVersion: metric.algorithmVersion,
          confidenceScore: metric.confidenceScore,
          counterexampleCount: metric.counterexampleCount,
          dataCompleteness: metric.dataCompleteness.toNumber(),
          dominantStatus: metric.dominantStatus,
          effectSize: metric.effectSize.toNumber(),
          evidenceId: metric.id,
          failCount: metric.failCount,
          knownSampleSize: metric.knownSampleSize,
          level: metric.level,
          passCount: metric.passCount,
          patternType: metric.patternType,
          sampleSize: metric.sampleSize,
          unknownCount: metric.unknownCount
        })),
        snapshots.map((snapshot) => ({
          evidenceId: snapshot.id,
          openedAt: snapshot.trade.openedAt,
          patternType: snapshot.patternType,
          status: snapshotStatus(snapshot.outputData),
          symbol: snapshot.trade.symbol,
          tradeId: snapshot.trade.id
        })),
        explanation
      )
    };
  }
}
