import { SetMetadata } from "@nestjs/common";
import type { Role } from "../generated/prisma/enums.js";

export const REQUIRED_ROLES = "required-roles";

export function RequireRoles(...roles: readonly Role[]): MethodDecorator & ClassDecorator {
  return SetMetadata(REQUIRED_ROLES, roles);
}
