import "reflect-metadata";
import { ConsoleLogger, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ApiExceptionFilter } from "./api-exception.filter.js";
import { ApiResponseInterceptor } from "./api-response.interceptor.js";
import { AppModule } from "./app.module.js";

export interface CreateAppOptions {
  logger?: false | ConsoleLogger;
}

export async function createApp(options: CreateAppOptions = {}): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    logger: options.logger ?? new ConsoleLogger({ json: true })
  });
  app.useBodyParser("json", { limit: "2mb" });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("RULIVO API")
      .setDescription("Trading journal and behavioral review API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build()
  );
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs-json"
  });

  await app.init();
  return app;
}
