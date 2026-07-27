import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { AuthorizationModule } from "./authorization/authorization.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthController } from "./health.controller.js";
import { PreferencesModule } from "./preferences/preferences.module.js";
import { RequestIdMiddleware } from "./request-id.middleware.js";

@Module({
  controllers: [HealthController],
  imports: [DatabaseModule, AuthModule, PreferencesModule, AuthorizationModule]
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
