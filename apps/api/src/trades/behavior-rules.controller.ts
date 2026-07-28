import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { BehaviorRulesService } from "./behavior-rules.service.js";

const idSchema = z.uuid();
const createPlaybookSchema = z.object({
  lossReentryMinutes: z.number().int().min(1).max(1440).default(30),
  maxDailyTrades: z.number().int().min(1).max(100).default(5),
  name: z.string().trim().min(1).max(100),
  positionIncreasePercent: z.number().int().min(1).max(1000).default(50)
});
const playbookReferenceSchema = z.object({ playbookId: z.uuid() });
const playbookAssignmentSchema = z.object({ playbookId: z.uuid().nullable() });
const stopEventSchema = z.object({
  newStopPriceMinor: z.string().regex(/^\d+$/),
  occurredAt: z.iso.datetime({ offset: true }),
  previousStopPriceMinor: z.string().regex(/^\d+$/)
});

@ApiTags("Behavior rules")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class BehaviorRulesController {
  public constructor(@Inject(BehaviorRulesService) private readonly rules: BehaviorRulesService) {}

  @Post("playbooks")
  public async createPlaybook(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = createPlaybookSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }
    return this.rules.createPlaybook(request.auth.userId, parsed.data);
  }

  @Put("trades/:tradeId/playbook")
  public async assign(
    @Req() request: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
    @Body() body: unknown
  ) {
    const parsedId = idSchema.safeParse(tradeId);
    const parsedBody = playbookAssignmentSchema.safeParse(body);
    if (!parsedId.success || !parsedBody.success) {
      throw new BadRequestException("Invalid trade or playbook ID");
    }
    return this.rules.assignPlaybook(
      request.auth.userId,
      parsedId.data,
      parsedBody.data.playbookId
    );
  }

  @Post("trades/:tradeId/rules/evaluate")
  public async evaluate(
    @Req() request: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
    @Body() body: unknown
  ) {
    const parsedId = idSchema.safeParse(tradeId);
    const parsedBody = playbookReferenceSchema.safeParse(body);
    if (!parsedId.success || !parsedBody.success) {
      throw new BadRequestException("Invalid trade or playbook ID");
    }
    return this.rules.evaluate(request.auth.userId, parsedId.data, parsedBody.data.playbookId);
  }

  @Post("trades/:tradeId/stop-events")
  public async stopEvent(
    @Req() request: AuthenticatedRequest,
    @Param("tradeId") tradeId: string,
    @Body() body: unknown
  ) {
    const parsedId = idSchema.safeParse(tradeId);
    const parsedBody = stopEventSchema.safeParse(body);
    if (!parsedId.success || !parsedBody.success) {
      throw new BadRequestException("Invalid trade ID or stop event");
    }
    return this.rules.recordStopEvent(request.auth.userId, parsedId.data, parsedBody.data);
  }

  @Get("trades/:tradeId/rule-results")
  public async results(@Req() request: AuthenticatedRequest, @Param("tradeId") tradeId: string) {
    const parsedId = idSchema.safeParse(tradeId);
    if (!parsedId.success) throw new BadRequestException("Invalid trade ID");
    return this.rules.results(request.auth.userId, parsedId.data);
  }
}
