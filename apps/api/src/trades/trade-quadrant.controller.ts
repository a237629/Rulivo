import { Controller, Inject, Param, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { TradeQuadrantService } from "./trade-quadrant.service.js";

@ApiTags("Trades")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("trades")
export class TradeQuadrantController {
  public constructor(
    @Inject(TradeQuadrantService) private readonly quadrants: TradeQuadrantService
  ) {}

  @Put(":tradeId/quadrant")
  public evaluate(@Req() request: AuthenticatedRequest, @Param("tradeId") tradeId: string) {
    return this.quadrants.evaluate(request.auth.userId, tradeId);
  }
}
