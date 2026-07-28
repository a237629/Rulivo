import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { parseTradeListQuery } from "./trade-list.query.js";
import { TradeListService } from "./trade-list.service.js";

@ApiTags("Trades")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("trades")
export class TradeListController {
  public constructor(private readonly trades: TradeListService) {}

  @Get()
  public list(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    return this.trades.list(request.auth.userId, parseTradeListQuery(query));
  }
}
