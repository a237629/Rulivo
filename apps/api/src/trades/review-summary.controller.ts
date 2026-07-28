import { Controller, Get, Param, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { ReviewSummaryService } from "./review-summary.service.js";

@ApiTags("Trades")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("trades")
export class ReviewSummaryController {
  public constructor(private readonly summaries: ReviewSummaryService) {}

  @Put(":tradeId/review-summary")
  public generate(@Req() request: AuthenticatedRequest, @Param("tradeId") tradeId: string) {
    return this.summaries.generate(request.auth.userId, tradeId);
  }

  @Get(":tradeId/review-summary")
  public get(@Req() request: AuthenticatedRequest, @Param("tradeId") tradeId: string) {
    return this.summaries.get(request.auth.userId, tradeId);
  }
}
