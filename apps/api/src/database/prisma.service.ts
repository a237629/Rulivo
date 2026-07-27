import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  public constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString === undefined || connectionString.length === 0) {
      throw new Error("DATABASE_URL is required to start the API.");
    }
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
