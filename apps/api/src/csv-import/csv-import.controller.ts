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
import { CsvImportService } from "./csv-import.service.js";
import { applyCsvMappingSchema, applyCsvPresetSchema, uploadCsvSchema } from "./csv-validation.js";

const batchIdSchema = z.uuid();

@ApiTags("CSV imports")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("imports/csv")
export class CsvImportController {
  public constructor(@Inject(CsvImportService) private readonly imports: CsvImportService) {}

  @Post("upload")
  public async upload(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = uploadCsvSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }
    return this.imports.upload(request.auth.userId, parsed.data);
  }

  @Get("mapping-templates")
  public async templates(@Req() request: AuthenticatedRequest) {
    return this.imports.listTemplates(request.auth.userId);
  }

  @Get("presets")
  public presets() {
    return this.imports.listPresets();
  }

  @Post(":batchId/detect-preset")
  public async detectPreset(
    @Req() request: AuthenticatedRequest,
    @Param("batchId") batchId: string
  ) {
    const parsedId = batchIdSchema.safeParse(batchId);
    if (!parsedId.success) throw new BadRequestException("Invalid batch ID");
    return this.imports.detectPreset(request.auth.userId, parsedId.data);
  }

  @Put(":batchId/preset")
  public async preset(
    @Req() request: AuthenticatedRequest,
    @Param("batchId") batchId: string,
    @Body() body: unknown
  ) {
    const parsedId = batchIdSchema.safeParse(batchId);
    const parsedBody = applyCsvPresetSchema.safeParse(body);
    if (!parsedId.success || !parsedBody.success) {
      throw new BadRequestException(
        parsedBody.success
          ? "Invalid batch ID"
          : parsedBody.error.issues.map((issue) => issue.message)
      );
    }
    return this.imports.applyPreset(request.auth.userId, parsedId.data, parsedBody.data.presetId);
  }

  @Get(":batchId")
  public async get(@Req() request: AuthenticatedRequest, @Param("batchId") batchId: string) {
    const parsedId = batchIdSchema.safeParse(batchId);
    if (!parsedId.success) throw new BadRequestException("Invalid batch ID");
    return this.imports.get(request.auth.userId, parsedId.data);
  }

  @Put(":batchId/mapping")
  public async mapping(
    @Req() request: AuthenticatedRequest,
    @Param("batchId") batchId: string,
    @Body() body: unknown
  ) {
    const parsedId = batchIdSchema.safeParse(batchId);
    const parsedBody = applyCsvMappingSchema.safeParse(body);
    if (!parsedId.success || !parsedBody.success) {
      throw new BadRequestException(
        parsedBody.success
          ? "Invalid batch ID"
          : parsedBody.error.issues.map((issue) => issue.message)
      );
    }
    return this.imports.applyMapping(request.auth.userId, parsedId.data, parsedBody.data);
  }

  @Post(":batchId/confirm")
  public async confirm(@Req() request: AuthenticatedRequest, @Param("batchId") batchId: string) {
    const parsedId = batchIdSchema.safeParse(batchId);
    if (!parsedId.success) throw new BadRequestException("Invalid batch ID");
    return this.imports.confirm(request.auth.userId, parsedId.data);
  }

  @Post(":batchId/group")
  public async group(@Req() request: AuthenticatedRequest, @Param("batchId") batchId: string) {
    const parsedId = batchIdSchema.safeParse(batchId);
    if (!parsedId.success) throw new BadRequestException("Invalid batch ID");
    return this.imports.group(request.auth.userId, parsedId.data);
  }
}
