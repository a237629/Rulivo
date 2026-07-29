import {
  BadGatewayException,
  Inject,
  Injectable,
  UnprocessableEntityException
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../database/prisma.service.js";
import {
  PATTERN_EXPLANATION_PROMPT_VERSION,
  validatePatternExplanation,
  type PatternExplanationMetricInput
} from "./pattern-explanation.contract.js";
import { PatternExplanationModel } from "./pattern-explanation-model.service.js";

function fingerprint(metrics: PatternExplanationMetricInput[]): string {
  return createHash("sha256").update(JSON.stringify(metrics)).digest("hex");
}

@Injectable()
export class PatternExplanationService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PatternExplanationModel) private readonly model: PatternExplanationModel
  ) {}

  public async get(userId: string) {
    const [explanation, metrics] = await Promise.all([
      this.prisma.behaviorPatternExplanation.findUnique({ where: { userId } }),
      this.prisma.behaviorPatternConfidence.findMany({
        orderBy: { patternType: "asc" },
        select: { id: true },
        where: { userId }
      })
    ]);
    if (explanation === null) return null;
    const inputMetricIds = Array.isArray(explanation.inputMetricIds)
      ? explanation.inputMetricIds.filter((id): id is string => typeof id === "string")
      : [];
    const currentMetricIds = metrics.map(({ id }) => id);
    if (
      inputMetricIds.length !== currentMetricIds.length ||
      inputMetricIds.some((id, index) => id !== currentMetricIds[index])
    ) {
      return null;
    }
    return explanation;
  }

  public async generate(userId: string) {
    const rows = await this.prisma.behaviorPatternConfidence.findMany({
      orderBy: { patternType: "asc" },
      where: { userId }
    });
    if (rows.length === 0) {
      throw new UnprocessableEntityException("Calculated pattern confidence metrics are required");
    }
    const metrics: PatternExplanationMetricInput[] = rows.map((row) => ({
      algorithm_version: row.algorithmVersion,
      confidence_score: row.confidenceScore,
      counterexample_count: row.counterexampleCount,
      data_completeness: row.dataCompleteness.toNumber(),
      dominant_status: row.dominantStatus,
      effect_size: row.effectSize.toNumber(),
      evidence_id: row.id,
      fail_count: row.failCount,
      known_sample_size: row.knownSampleSize,
      level: row.level,
      pass_count: row.passCount,
      pattern_type: row.patternType,
      sample_size: row.sampleSize,
      unknown_count: row.unknownCount
    }));
    const rawOutput = await this.model.explain(metrics);
    let output;
    try {
      output = validatePatternExplanation(rawOutput, metrics);
    } catch {
      throw new BadGatewayException("Pattern explanation model returned invalid evidence");
    }
    return this.prisma.behaviorPatternExplanation.upsert({
      create: {
        inputFingerprint: fingerprint(metrics),
        inputMetricIds: metrics.map(({ evidence_id }) => evidence_id),
        modelVersion: this.model.modelVersion,
        output,
        promptVersion: PATTERN_EXPLANATION_PROMPT_VERSION,
        userId
      },
      update: {
        generatedAt: new Date(),
        inputFingerprint: fingerprint(metrics),
        inputMetricIds: metrics.map(({ evidence_id }) => evidence_id),
        modelVersion: this.model.modelVersion,
        output,
        promptVersion: PATTERN_EXPLANATION_PROMPT_VERSION
      },
      where: { userId }
    });
  }
}
