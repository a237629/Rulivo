import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredPaths = [
  "apps/mobile/package.json",
  "apps/api/package.json",
  "apps/admin/package.json",
  "apps/web/package.json",
  "apps/analytics-worker/package.json",
  "packages/contracts/package.json",
  "packages/config/package.json",
  "packages/i18n/package.json",
  "packages/ui/package.json",
  "packages/typescript-config/base.json"
];

for (const path of requiredPaths) {
  if (!existsSync(resolve(root, path))) {
    throw new Error(`Missing workspace path: ${path}`);
  }
}

const baseConfig = JSON.parse(
  readFileSync(resolve(root, "packages/typescript-config/base.json"), "utf8")
);

if (baseConfig.compilerOptions?.strict !== true) {
  throw new Error("TypeScript strict mode must be enabled");
}
