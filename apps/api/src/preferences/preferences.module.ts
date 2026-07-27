import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PreferencesController } from "./preferences.controller.js";
import { PreferencesService } from "./preferences.service.js";

@Module({
  controllers: [PreferencesController],
  imports: [AuthModule],
  providers: [PreferencesService]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class PreferencesModule {}
