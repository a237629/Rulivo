import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { screenshotConfirmationSchema } from "./screenshot-parse.contract.js";
import { ScreenshotParsesService } from "./screenshot-parses.service.js";

const idSchema = z.uuid();

@ApiTags("Screenshot parsing")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class ScreenshotParsesController {
  public constructor(private readonly parses: ScreenshotParsesService) {}

  @Post("images/:imageId/parse")
  public create(@Req() request: AuthenticatedRequest, @Param("imageId") imageId: string) {
    if (!idSchema.safeParse(imageId).success) throw new BadRequestException("Invalid image ID");
    return this.parses.create(request.auth.userId, imageId);
  }

  @Get("screenshot-parses/:parseId")
  public get(@Req() request: AuthenticatedRequest, @Param("parseId") parseId: string) {
    if (!idSchema.safeParse(parseId).success) throw new BadRequestException("Invalid parse ID");
    return this.parses.get(request.auth.userId, parseId);
  }

  @Post("screenshot-parses/:parseId/confirm")
  public confirm(
    @Req() request: AuthenticatedRequest,
    @Param("parseId") parseId: string,
    @Body() body: unknown
  ) {
    const id = idSchema.safeParse(parseId);
    const confirmation = screenshotConfirmationSchema.safeParse(body);
    if (!id.success || !confirmation.success) {
      throw new BadRequestException("All recognized fields require explicit confirmation");
    }
    return this.parses.confirm(request.auth.userId, id.data, confirmation.data);
  }
}
