/* global process */
import { spawnSync } from "node:child_process";
import { config as loadEnvironment } from "dotenv";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({
  override: false,
  path: resolve(scriptDirectory, "../../../.env"),
  quiet: true
});

const prismaArguments = {
  "migrate-deploy": ["migrate", "deploy"],
  "migrate-dev": ["migrate", "dev"],
  "migrate-reset": ["migrate", "reset"],
  "db-push": ["db", "push"],
  seed: ["db", "seed"]
};
const productionBlockedCommands = new Set(["migrate-dev", "migrate-reset", "db-push", "seed"]);
const command = process.argv[2];

if (!(command in prismaArguments)) {
  throw new Error("A valid database command is required.");
}

if (process.env.APP_ENV === "production" && productionBlockedCommands.has(command)) {
  throw new Error(
    `Database command "${command}" is disabled in production. Use the reviewed migrate-deploy workflow.`
  );
}

if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL.length === 0) {
  throw new Error("DATABASE_URL is required for database commands.");
}

const require = createRequire(import.meta.url);
const prismaCli = require.resolve("prisma/build/index.js");
const result = spawnSync(process.execPath, [prismaCli, ...prismaArguments[command]], {
  env: process.env,
  shell: false,
  stdio: "inherit"
});

if (result.error !== undefined) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
