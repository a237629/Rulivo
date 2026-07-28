import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CoreStatisticsController } from "./core-statistics.controller.js";
import { CoreStatisticsService } from "./core-statistics.service.js";

@Module({
  controllers: [CoreStatisticsController],
  imports: [AuthModule],
  providers: [CoreStatisticsService]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AnalyticsModule {}
