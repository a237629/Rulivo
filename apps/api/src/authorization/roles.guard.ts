import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedRequest } from "../auth/auth.guard.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Role } from "../generated/prisma/enums.js";
import { REQUIRED_ROLES } from "./roles.decorator.js";

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<readonly Role[] | undefined>(REQUIRED_ROLES, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];
    if (required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const assignments = await this.prisma.userRoleAssignment.findMany({
      select: { role: true },
      where: { userId: request.auth.userId }
    });
    const granted = new Set(assignments.map(({ role }) => role));
    if (!required.some((role) => granted.has(role))) {
      throw new ForbiddenException("Insufficient role");
    }
    return true;
  }
}
