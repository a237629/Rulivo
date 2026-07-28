import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { CoreStatisticsService } from "./core-statistics.service.js";

const querySchema = z
  .object({
    from: z.iso.datetime({ offset: true }).optional(),
    timeZone: z.string().trim().min(1).max(64).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    tradingAccountId: z.uuid().optional()
  })
  .refine(
    ({ from, to }) =>
      from === undefined || to === undefined || new Date(from).valueOf() < new Date(to).valueOf(),
    { message: "from must be earlier than to" }
  );

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("analytics")
export class CoreStatisticsController {
  public constructor(
    @Inject(CoreStatisticsService) private readonly statistics: CoreStatisticsService
  ) {}

  @Get("core")
  public async get(@Req() request: AuthenticatedRequest, @Query() query: unknown) {
    const parsed = querySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }
    try {
      return await this.statistics.get(request.auth.userId, parsed.data);
    } catch (error) {
      if (error instanceof RangeError) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
