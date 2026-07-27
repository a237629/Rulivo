import "reflect-metadata";
import { pathToFileURL } from "node:url";
import { loadEnvironment } from "@rulivo/config";
import { createApp } from "./app.js";

export const applicationName = "RULIVO api";

export async function start(): Promise<void> {
  const environment = loadEnvironment();
  const app = await createApp();
  await app.listen(environment.apiPort);
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  void start().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
