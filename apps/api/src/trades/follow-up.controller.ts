import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { FollowUpService } from "./follow-up.service.js";

const answerSchema = z
  .object({
    freeText: z.string().trim().min(1).max(2000).optional(),
    selectedOption: z.string().min(1).max(100).optional()
  })
  .strict()
  .refine(
    ({ freeText, selectedOption }) => (freeText === undefined) !== (selectedOption === undefined),
    "Provide exactly one quick option or free-text answer"
  );

@ApiTags("Trades")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class FollowUpController {
  public constructor(@Inject(FollowUpService) private readonly followUps: FollowUpService) {}

  @Post("trades/:tradeId/follow-ups")
  public start(@Req() request: AuthenticatedRequest, @Param("tradeId") tradeId: string) {
    return this.followUps.start(request.auth.userId, tradeId);
  }

  @Get("trades/:tradeId/follow-ups/current")
  public current(@Req() request: AuthenticatedRequest, @Param("tradeId") tradeId: string) {
    return this.followUps.current(request.auth.userId, tradeId);
  }

  @Post("follow-ups/:sessionId/answers")
  public answer(
    @Req() request: AuthenticatedRequest,
    @Param("sessionId") sessionId: string,
    @Body() body: unknown
  ) {
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map(({ message }) => message));
    }
    return this.followUps.answer(request.auth.userId, sessionId, parsed.data);
  }
}
