import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { patternExplanationOutputSchema } from "./pattern-explanation.contract.js";
import type { PatternExplanationFeedbackInput } from "./pattern-explanation-feedback.contract.js";

@Injectable()
export class PatternExplanationFeedbackService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async submit(
    userId: string,
    explanationId: string,
    input: PatternExplanationFeedbackInput
  ) {
    const explanation = await this.prisma.behaviorPatternExplanation.findFirst({
      where: { id: explanationId, userId }
    });
    if (explanation === null) throw new NotFoundException("Pattern explanation was not found");
    const output = patternExplanationOutputSchema.parse(explanation.output);
    const patternOutput = output.explanations.find(
      ({ pattern_type }) => pattern_type === input.patternType
    );
    if (patternOutput === undefined) {
      throw new NotFoundException("Pattern explanation section was not found");
    }
    const unique = {
      explanationId,
      explanationInputFingerprint: explanation.inputFingerprint,
      patternType: input.patternType,
      reason: input.reason,
      userId
    };
    const existing = await this.prisma.patternExplanationFeedback.findFirst({ where: unique });
    if (existing !== null) {
      throw new ConflictException("This correction was already submitted");
    }
    return this.prisma.patternExplanationFeedback.create({
      data: {
        ...(input.comment === undefined ? {} : { comment: input.comment }),
        explanationId,
        explanationInputFingerprint: explanation.inputFingerprint,
        explanationOutputSnapshot: patternOutput,
        modelVersion: explanation.modelVersion,
        patternType: input.patternType,
        promptVersion: explanation.promptVersion,
        reason: input.reason,
        userId
      },
      select: {
        id: true,
        patternType: true,
        reason: true,
        submittedAt: true
      }
    });
  }
}
