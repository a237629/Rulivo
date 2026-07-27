import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Global()
@Module({
  exports: [PrismaService],
  providers: [PrismaService]
})
// Nest modules are declarative classes consumed through decorator metadata.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DatabaseModule {}
