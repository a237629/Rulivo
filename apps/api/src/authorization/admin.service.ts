import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import type { Role } from "../generated/prisma/enums.js";

export interface AuditContext {
  actorUserId: string;
  ipAddress?: string;
  requestId: string;
}

@Injectable()
export class AdminService {
  public constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  public async getRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      select: {
        email: true,
        id: true,
        roleAssignments: { orderBy: { role: "asc" }, select: { role: true } }
      },
      where: { id: userId }
    });
    if (user === null) throw new NotFoundException("User not found");
    return {
      email: user.email,
      id: user.id,
      roles: user.roleAssignments.map(({ role }) => role)
    };
  }

  public async replaceRoles(userId: string, roles: readonly Role[], context: AuditContext) {
    if (!roles.includes("USER")) {
      throw new BadRequestException("Every account must retain the USER role");
    }
    const uniqueRoles = [...new Set(roles)].sort();

    return this.prisma.$transaction(async (tx) => {
      const [actor, target] = await Promise.all([
        tx.user.findUnique({ select: { email: true }, where: { id: context.actorUserId } }),
        tx.user.findUnique({
          select: {
            email: true,
            roleAssignments: { orderBy: { role: "asc" }, select: { role: true } }
          },
          where: { id: userId }
        })
      ]);
      if (actor === null) throw new NotFoundException("Actor not found");
      if (target === null) throw new NotFoundException("User not found");

      const previousRoles = target.roleAssignments.map(({ role }) => role);
      const removesAdmin = previousRoles.includes("ADMIN") && !uniqueRoles.includes("ADMIN");
      if (userId === context.actorUserId && removesAdmin) {
        throw new BadRequestException("Administrators cannot remove their own ADMIN role");
      }
      if (removesAdmin) {
        const adminCount = await tx.userRoleAssignment.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          throw new BadRequestException("The last ADMIN role cannot be removed");
        }
      }

      await tx.userRoleAssignment.deleteMany({ where: { userId } });
      await tx.userRoleAssignment.createMany({
        data: uniqueRoles.map((role) => ({ role, userId }))
      });
      await tx.auditLog.create({
        data: {
          action: "USER_ROLES_REPLACED",
          actorEmail: actor.email,
          actorUserId: context.actorUserId,
          ...(context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress }),
          metadata: { after: uniqueRoles, before: previousRoles },
          requestId: context.requestId,
          targetIdentifier: target.email,
          targetType: "USER",
          targetUserId: userId
        }
      });
      return { email: target.email, id: userId, roles: uniqueRoles };
    });
  }

  public async listAuditLogs(take: number) {
    return this.prisma.auditLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      select: {
        action: true,
        actorEmail: true,
        actorUserId: true,
        createdAt: true,
        id: true,
        ipAddress: true,
        metadata: true,
        requestId: true,
        targetIdentifier: true,
        targetType: true,
        targetUserId: true
      }
    });
  }
}
