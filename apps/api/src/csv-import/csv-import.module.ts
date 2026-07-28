import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CsvImportController } from "./csv-import.controller.js";
import { CsvImportService } from "./csv-import.service.js";

@Module({
  controllers: [CsvImportController],
  imports: [AuthModule],
  providers: [CsvImportService]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CsvImportModule {}
