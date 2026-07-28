import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { AuthorizationModule } from "./authorization/authorization.module.js";
import { CsvImportModule } from "./csv-import/csv-import.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthController } from "./health.controller.js";
import { ImagesModule } from "./images/images.module.js";
import { PreferencesModule } from "./preferences/preferences.module.js";
import { RequestIdMiddleware } from "./request-id.middleware.js";
import { TradesModule } from "./trades/trades.module.js";
import { VoiceRecordingsModule } from "./voice-recordings/voice-recordings.module.js";

@Module({
  controllers: [HealthController],
  imports: [
    DatabaseModule,
    AuthModule,
    PreferencesModule,
    AuthorizationModule,
    CsvImportModule,
    TradesModule,
    AnalyticsModule,
    ImagesModule,
    VoiceRecordingsModule
  ]
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
