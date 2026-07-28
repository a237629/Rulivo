import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { TradeDetailService } from "./trade-detail.service.js";
import { parseTradeNote } from "./trade-detail.input.js";

@ApiTags("Trades")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("trades")
export class TradeDetailController {
  public constructor(private readonly details: TradeDetailService) {}

  @Get(":tradeId")
  public get(@Req() request: AuthenticatedRequest, @Param("tradeId") tradeId: string) {
    return this.details.get(request.auth.userId, tradeId);
  }

  @Post(":tradeId/notes")
  public createNote(
    @Req() request: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
    @Body() input: unknown
  ) {
    return this.details.createNote(request.auth.userId, tradeId, parseTradeNote(input).body);
  }

  @Patch(":tradeId/notes/:noteId")
  public updateNote(
    @Req() request: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
    @Param("noteId") noteId: string,
    @Body() input: unknown
  ) {
    return this.details.updateNote(
      request.auth.userId,
      tradeId,
      noteId,
      parseTradeNote(input).body
    );
  }

  @Delete(":tradeId/notes/:noteId")
  public deleteNote(
    @Req() request: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
    @Param("noteId") noteId: string
  ) {
    return this.details.deleteNote(request.auth.userId, tradeId, noteId);
  }
}
