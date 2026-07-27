import "dotenv/config";
import { defineConfig } from "prisma/config";

const schemaOnlyUrl =
  process.env.DATABASE_URL ?? "postgresql://schema-only:schema-only@127.0.0.1:1/rulivo";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: schemaOnlyUrl
  }
});
