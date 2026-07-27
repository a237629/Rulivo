import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Put,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { getRequestId } from "../request-context.js";
import { AdminService } from "./admin.service.js";
import { RequireRoles } from "./roles.decorator.js";
import { RolesGuard } from "./roles.guard.js";

const userIdSchema = z.uuid();
const rolesSchema = z
  .object({
    roles: z.array(z.enum(["USER", "SUPPORT", "ANALYST", "ADMIN"])).min(1)
  })
  .strict();
const takeSchema = z.coerce.number().int().min(1).max(100).default(50);

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
@RequireRoles("ADMIN")
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  public constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get("users/:userId/roles")
  public async getRoles(@Param("userId") userIdInput: string) {
    return this.admin.getRoles(this.userId(userIdInput));
  }

  @Put("users/:userId/roles")
  public async replaceRoles(
    @Param("userId") userIdInput: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest
  ) {
    const parsed = rolesSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }
    return this.admin.replaceRoles(this.userId(userIdInput), parsed.data.roles, {
      actorUserId: request.auth.userId,
      ...(request.ip === undefined ? {} : { ipAddress: request.ip }),
      requestId: getRequestId(request)
    });
  }

  @Get("audit-logs")
  public async listAuditLogs(@Query("take") takeInput?: string) {
    const parsed = takeSchema.safeParse(takeInput);
    if (!parsed.success) throw new BadRequestException("take must be between 1 and 100");
    return this.admin.listAuditLogs(parsed.data);
  }

  private userId(input: string): string {
    const parsed = userIdSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException("Invalid user ID");
    return parsed.data;
  }
}
