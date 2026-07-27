import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve("prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  resolve("prisma/migrations/20260727000100_step_7_core_tables/migration.sql"),
  "utf8"
);

describe("step 7 database contract", () => {
  it.each(["users", "user_profiles", "trading_accounts", "trades", "subscriptions"])(
    "creates the %s table",
    (table) => {
      expect(migration).toContain(`CREATE TABLE "${table}"`);
    }
  );

  it("stores money as integer minor units and timestamps with a timezone", () => {
    expect(schema).toContain("entryPriceMinor");
    expect(schema).toContain("realizedPnlMinor");
    expect(migration).toContain('"entry_price_minor" BIGINT');
    expect(migration).toContain('"realized_pnl_minor" BIGINT');
    expect(migration).toContain("TIMESTAMPTZ(3)");
  });

  it.each(["auth_identities", "email_verifications", "auth_sessions"])(
    "creates the step 8 %s table",
    (table) => {
      const authMigration = readFileSync(
        resolve("prisma/migrations/20260727000200_step_8_authentication/migration.sql"),
        "utf8"
      );
      expect(authMigration).toContain(`CREATE TABLE "${table}"`);
    }
  );

  it("protects tenant ownership and basic trade invariants", () => {
    expect(migration).toContain(
      'FOREIGN KEY ("trading_account_id", "user_id") REFERENCES "trading_accounts"("id", "user_id")'
    );
    expect(migration).toContain("trades_quantity_positive_check");
    expect(migration).toContain("trades_closed_at_check");
  });

  it("contains no destructive statement in the initial migration", () => {
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("adds all step 9 preference fields without destructive SQL", () => {
    const preferenceMigration = readFileSync(
      resolve("prisma/migrations/20260727000300_step_9_user_preferences/migration.sql"),
      "utf8"
    );
    expect(preferenceMigration).toContain('"default_market"');
    expect(preferenceMigration).toContain('"risk_unit"');
    expect(preferenceMigration).toContain('"onboarding_completed_at"');
    expect(preferenceMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("adds step 10 roles and append-only audit storage", () => {
    const authorizationMigration = readFileSync(
      resolve("prisma/migrations/20260727000400_step_10_rbac_audit/migration.sql"),
      "utf8"
    );
    expect(authorizationMigration).toContain('CREATE TYPE "Role"');
    expect(authorizationMigration).toContain('CREATE TABLE "user_role_assignments"');
    expect(authorizationMigration).toContain('CREATE TABLE "audit_logs"');
    expect(authorizationMigration).toContain("audit_logs_immutable");
    expect(authorizationMigration).not.toMatch(/\b(?:DROP TABLE|TRUNCATE)\b/i);
  });
});
