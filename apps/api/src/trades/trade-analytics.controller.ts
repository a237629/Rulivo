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
import { TradeAnalyticsService } from "./trade-analytics.service.js";

const tradeIdSchema = z.uuid();
const analyticsInputSchema = z.object({
  initialRiskMinor: z.union([z.string().regex(/^[1-9]\d*$/), z.null()]).optional()
});

@ApiTags("Trades")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("trades")
export class TradeAnalyticsController {
  public constructor(
    @Inject(TradeAnalyticsService) private readonly analytics: TradeAnalyticsService
  ) {}

  @Put(":tradeId/analytics")
  public async calculate(
    @Req() request: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
    @Body() body: unknown
  ) {
    const parsedId = tradeIdSchema.safeParse(tradeId);
    const parsedBody = analyticsInputSchema.safeParse(body);
    if (!parsedId.success || !parsedBody.success) {
      throw new BadRequestException(
        parsedBody.success
          ? "Invalid trade ID"
          : parsedBody.error.issues.map((issue) => issue.message)
      );
    }
    return this.analytics.calculate(request.auth.userId, parsedId.data, parsedBody.data);
  }
}
