import { Controller, Get, Inject, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { PatternConfidenceService } from "./pattern-confidence.service.js";

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("analytics/pattern-confidence")
export class PatternConfidenceController {
  public constructor(
    @Inject(PatternConfidenceService) private readonly confidence: PatternConfidenceService
  ) {}

  @Get()
  public get(@Req() request: AuthenticatedRequest) {
    return this.confidence.get(request.auth.userId);
  }
}
