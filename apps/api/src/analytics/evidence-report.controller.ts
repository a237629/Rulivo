import { Controller, Get, Inject, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { EvidenceReportService } from "./evidence-report.service.js";

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("analytics/evidence-report")
export class EvidenceReportController {
  public constructor(
    @Inject(EvidenceReportService) private readonly report: EvidenceReportService
  ) {}

  @Get()
  public get(@Req() request: AuthenticatedRequest) {
    return this.report.get(request.auth.userId);
  }
}
