export type DatabaseCommand =
  "migrate-deploy" | "migrate-dev" | "migrate-reset" | "db-push" | "seed";

const productionBlockedCommands = new Set<DatabaseCommand>([
  "migrate-dev",
  "migrate-reset",
  "db-push",
  "seed"
]);

export function assertDatabaseCommandAllowed(
  command: DatabaseCommand,
  appEnvironment: string | undefined
): void {
  if (appEnvironment === "production" && productionBlockedCommands.has(command)) {
    throw new Error(
      `Database command "${command}" is disabled in production. Use the reviewed migrate-deploy workflow.`
    );
  }
}

export function prismaArgumentsFor(command: DatabaseCommand): readonly string[] {
  switch (command) {
    case "migrate-deploy":
      return ["migrate", "deploy"];
    case "migrate-dev":
      return ["migrate", "dev"];
    case "migrate-reset":
      return ["migrate", "reset"];
    case "db-push":
      return ["db", "push"];
    case "seed":
      return ["db", "seed"];
  }
}
