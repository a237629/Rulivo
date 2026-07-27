export function assertSeedAllowed(appEnvironment: string | undefined): void {
  if (appEnvironment === "production") {
    throw new Error("Database seed is disabled in production.");
  }
}
