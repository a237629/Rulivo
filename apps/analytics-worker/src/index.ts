import { loadEnvironment } from "@rulivo/config";
import { parsePatternDetectionMode, runPatternDetection } from "./pattern-detection.js";
import { PostgresPatternDetectionStore } from "./postgres-pattern-store.js";

export const applicationName = "RULIVO analytics worker";

export async function start(): Promise<void> {
  const environment = loadEnvironment();
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("DATABASE_URL is required to run pattern detection");
  }
  const mode = parsePatternDetectionMode(process.argv[2]);
  const store = new PostgresPatternDetectionStore(connectionString);
  try {
    const result = await runPatternDetection(store, mode);
    console.log(
      `${applicationName} completed ${result.mode} (${environment.appEnvironment}/${environment.deploymentRegion}): ${String(result.processedTrades)} processed, ${String(result.failedTrades)} failed`
    );
    if (result.status === "FAILED") process.exitCode = 1;
  } finally {
    await store.close();
  }
}

if (process.env.NODE_ENV !== "test") {
  void start().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
