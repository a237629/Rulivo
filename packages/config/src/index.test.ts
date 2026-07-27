import { describe, expect, it } from "vitest";
import {
  EnvironmentConfigError,
  applicationEnvironments,
  deploymentRegions,
  parseEnvironment
} from "./index.js";

describe("environment configuration", () => {
  it.each(applicationEnvironments)("accepts the %s application environment", (appEnvironment) => {
    const result = parseEnvironment({
      APP_ENV: appEnvironment,
      DEPLOYMENT_REGION: "GLOBAL"
    });

    expect(result.appEnvironment).toBe(appEnvironment);
  });

  it.each(deploymentRegions)("accepts the %s deployment region", (deploymentRegion) => {
    const result = parseEnvironment({
      APP_ENV: "test",
      DEPLOYMENT_REGION: deploymentRegion
    });

    expect(result.deploymentRegion).toBe(deploymentRegion);
  });

  it("uses a safe default log level", () => {
    const result = parseEnvironment({
      APP_ENV: "local",
      DEPLOYMENT_REGION: "CHINA"
    });

    expect(result.logLevel).toBe("info");
    expect(result.apiPort).toBe(3000);
  });

  it("validates the API port range", () => {
    expect(() =>
      parseEnvironment({
        API_PORT: "70000",
        APP_ENV: "local",
        DEPLOYMENT_REGION: "GLOBAL"
      })
    ).toThrowError(/API_PORT/);
  });

  it("reports every missing required variable clearly", () => {
    expect(() => parseEnvironment({})).toThrowError(EnvironmentConfigError);
    expect(() => parseEnvironment({})).toThrowError(/APP_ENV/);
    expect(() => parseEnvironment({})).toThrowError(/DEPLOYMENT_REGION/);
  });

  it("rejects unsupported values", () => {
    expect(() =>
      parseEnvironment({
        APP_ENV: "development",
        DEPLOYMENT_REGION: "EU"
      })
    ).toThrowError(/local, test, staging, production/);
  });
});
