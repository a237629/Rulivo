import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

export const DEFAULT_LOCALE = "zh-CN";

export const applicationEnvironments = ["local", "test", "staging", "production"] as const;
export const deploymentRegions = ["GLOBAL", "CHINA"] as const;

const environmentSchema = z
  .object({
    APP_ENV: z.enum(applicationEnvironments, {
      error: "APP_ENV is required and must be one of: local, test, staging, production"
    }),
    DEPLOYMENT_REGION: z.enum(deploymentRegions, {
      error: "DEPLOYMENT_REGION is required and must be one of: GLOBAL, CHINA"
    }),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000)
  })
  .readonly();

export type EnvironmentConfig = Readonly<{
  appEnvironment: (typeof applicationEnvironments)[number];
  deploymentRegion: (typeof deploymentRegions)[number];
  logLevel: "debug" | "info" | "warn" | "error";
  apiPort: number;
}>;

export class EnvironmentConfigError extends Error {
  public constructor(messages: readonly string[]) {
    super(`Invalid environment configuration:\n- ${messages.join("\n- ")}`);
    this.name = "EnvironmentConfigError";
  }
}

export function parseEnvironment(source: NodeJS.ProcessEnv): EnvironmentConfig {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    const messages = result.error.issues.map((issue) => {
      const key = issue.path.join(".") || "environment";
      return `${key}: ${issue.message}`;
    });
    throw new EnvironmentConfigError(messages);
  }

  return {
    appEnvironment: result.data.APP_ENV,
    apiPort: result.data.API_PORT,
    deploymentRegion: result.data.DEPLOYMENT_REGION,
    logLevel: result.data.LOG_LEVEL
  };
}

export function loadEnvironment(source?: NodeJS.ProcessEnv): EnvironmentConfig {
  if (source === undefined) {
    loadDotEnv({ quiet: true });
  }

  return parseEnvironment(source ?? process.env);
}
