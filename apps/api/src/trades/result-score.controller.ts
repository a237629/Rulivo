import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Param,
  Put,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { ResultScoreService } from "./result-score.service.js";

const inputSchema = z
  .object({
    plannedTargetRMultiple: z
      .union([z.string().regex(/^(?:[1-9]\d*(?:\.\d{1,6})?|0\.(?=\d*[1-9])\d{1,6})$/), z.null()])
      .optional()
  })
  .strict();

@ApiTags("Trades")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("trades")
export class ResultScoreController {
  public constructor(@Inject(ResultScoreService) private readonly scores: ResultScoreService) {}

  @Put(":tradeId/result-score")
  public calculate(
    @Req() request: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
    @Body() body: unknown
  ) {
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }
    return this.scores.calculate(request.auth.userId, tradeId, parsed.data.plannedTargetRMultiple);
  }
}
