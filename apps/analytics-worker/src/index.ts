import { loadEnvironment } from "@rulivo/config";

export const applicationName = "RULIVO analytics worker";

export function start(): void {
  const environment = loadEnvironment();
  console.log(
    `${applicationName} skeleton is running (${environment.appEnvironment}/${environment.deploymentRegion})`
  );
}

if (process.env.NODE_ENV !== "test") {
  start();
}
