import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";
import { RolesGuard } from "./roles.guard.js";

@Module({
  controllers: [AdminController],
  imports: [AuthModule],
  providers: [AdminService, RolesGuard]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthorizationModule {}
