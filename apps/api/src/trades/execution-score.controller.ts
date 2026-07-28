import { Controller, Inject, Param, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { ExecutionScoreService } from "./execution-score.service.js";

@ApiTags("Trades")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("trades")
export class ExecutionScoreController {
  public constructor(
    @Inject(ExecutionScoreService) private readonly scores: ExecutionScoreService
  ) {}

  @Put(":tradeId/execution-score")
  public calculate(@Req() request: AuthenticatedRequest, @Param("tradeId") tradeId: string) {
    return this.scores.calculate(request.auth.userId, tradeId);
  }
}
