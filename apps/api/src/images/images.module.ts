import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ImagesController } from "./images.controller.js";
import { ImagesService } from "./images.service.js";
import { PrivateObjectStore } from "./private-object-store.js";
import { ScreenshotParser } from "./screenshot-parser.service.js";
import { ScreenshotParsesController } from "./screenshot-parses.controller.js";
import { ScreenshotParsesService } from "./screenshot-parses.service.js";

@Module({
  controllers: [ImagesController, ScreenshotParsesController],
  imports: [AuthModule],
  providers: [ImagesService, PrivateObjectStore, ScreenshotParser, ScreenshotParsesService]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ImagesModule {}
