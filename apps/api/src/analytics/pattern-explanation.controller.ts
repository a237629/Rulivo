import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { PatternExplanationService } from "./pattern-explanation.service.js";
import { patternExplanationFeedbackSchema } from "./pattern-explanation-feedback.contract.js";
import { PatternExplanationFeedbackService } from "./pattern-explanation-feedback.service.js";
import { z } from "zod";

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("analytics/pattern-explanations")
export class PatternExplanationController {
  public constructor(
    @Inject(PatternExplanationService) private readonly explanations: PatternExplanationService,
    @Inject(PatternExplanationFeedbackService)
    private readonly feedback: PatternExplanationFeedbackService
  ) {}

  @Get()
  public get(@Req() request: AuthenticatedRequest) {
    return this.explanations.get(request.auth.userId);
  }

  @Post("generate")
  public generate(@Req() request: AuthenticatedRequest) {
    return this.explanations.generate(request.auth.userId);
  }

  @Post(":explanationId/feedback")
  public submitFeedback(
    @Req() request: AuthenticatedRequest,
    @Param("explanationId") explanationIdInput: string,
    @Body() body: unknown
  ) {
    const explanationId = z.uuid().safeParse(explanationIdInput);
    const feedback = patternExplanationFeedbackSchema.safeParse(body);
    if (!explanationId.success || !feedback.success) {
      throw new BadRequestException("Invalid pattern explanation feedback");
    }
    return this.feedback.submit(request.auth.userId, explanationId.data, feedback.data);
  }
}
