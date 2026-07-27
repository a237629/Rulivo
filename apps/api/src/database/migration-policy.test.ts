import { describe, expect, it } from "vitest";
import { assertDatabaseCommandAllowed, prismaArgumentsFor } from "./migration-policy.js";

describe("database migration policy", () => {
  it.each(["migrate-dev", "migrate-reset", "db-push", "seed"] as const)(
    "blocks %s in production",
    (command) => {
      expect(() => {
        assertDatabaseCommandAllowed(command, "production");
      }).toThrow("disabled in production");
    }
  );

  it("allows only the deploy workflow to change a production schema", () => {
    expect(() => {
      assertDatabaseCommandAllowed("migrate-deploy", "production");
    }).not.toThrow();
    expect(prismaArgumentsFor("migrate-deploy")).toEqual(["migrate", "deploy"]);
  });
});
