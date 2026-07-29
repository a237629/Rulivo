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

  it("adds the step 11 instrument, execution and fee domain without data loss", () => {
    const tradeDomainMigration = readFileSync(
      resolve("prisma/migrations/20260727000600_step_11_trade_domain/migration.sql"),
      "utf8"
    );
    expect(tradeDomainMigration).toContain('CREATE TABLE "instruments"');
    expect(tradeDomainMigration).toContain('CREATE TABLE "executions"');
    expect(tradeDomainMigration).toContain('CREATE TABLE "fees"');
    expect(tradeDomainMigration).toContain('CREATE TYPE "ExecutionAction"');
    expect(tradeDomainMigration).toContain('CREATE TYPE "FeeType"');
    expect(tradeDomainMigration).toContain('UPDATE "trades" AS trade');
    expect(tradeDomainMigration).toContain("executions_quantity_positive_check");
    expect(tradeDomainMigration).toContain("fees_amount_nonnegative_check");
    expect(tradeDomainMigration).not.toMatch(/\b(?:DROP TABLE|TRUNCATE)\b/i);
  });

  it("adds step 12 CSV batches, rows, templates and duplicate detection", () => {
    const csvImportMigration = readFileSync(
      resolve("prisma/migrations/20260727000700_step_12_csv_import_framework/migration.sql"),
      "utf8"
    );
    expect(csvImportMigration).toContain('CREATE TYPE "CsvImportStatus"');
    expect(csvImportMigration).toContain('CREATE TABLE "csv_import_batches"');
    expect(csvImportMigration).toContain('CREATE TABLE "csv_import_rows"');
    expect(csvImportMigration).toContain('CREATE TABLE "csv_mapping_templates"');
    expect(csvImportMigration).toContain(
      'CREATE UNIQUE INDEX "csv_import_batches_user_id_content_hash_key"'
    );
    expect(csvImportMigration).toContain('FOREIGN KEY ("trading_account_id", "user_id")');
    expect(csvImportMigration).not.toMatch(/\b(?:DROP TABLE|TRUNCATE)\b/i);
  });

  it("records the selected step 13 preset with an allowlist constraint", () => {
    const presetMigration = readFileSync(
      resolve("prisma/migrations/20260728000100_step_13_csv_presets/migration.sql"),
      "utf8"
    );
    expect(presetMigration).toContain('ADD COLUMN "preset_id"');
    expect(presetMigration).toContain(
      "'BINANCE', 'OKX', 'BYBIT', 'INTERACTIVE_BROKERS', 'GENERIC'"
    );
    expect(presetMigration).toContain("csv_import_batches_preset_id_check");
    expect(presetMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("adds non-destructive and traceable step 14 trade grouping storage", () => {
    const groupingMigration = readFileSync(
      resolve("prisma/migrations/20260728000200_step_14_trade_grouping/migration.sql"),
      "utf8"
    );
    expect(groupingMigration).toContain('ADD COLUMN "grouped_at"');
    expect(groupingMigration).toContain('ADD COLUMN "import_batch_id"');
    expect(groupingMigration).toContain('CREATE TABLE "csv_import_execution_sources"');
    expect(groupingMigration).toContain("allocated_quantity");
    expect(groupingMigration).toContain("allocated_fee_minor");
    expect(groupingMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("adds step 15 initial risk and analytics timestamp without floating-point money", () => {
    const analyticsMigration = readFileSync(
      resolve("prisma/migrations/20260728000300_step_15_pnl_r/migration.sql"),
      "utf8"
    );
    expect(analyticsMigration).toContain('"initial_risk_minor" BIGINT');
    expect(analyticsMigration).toContain('"analytics_calculated_at" TIMESTAMPTZ(3)');
    expect(analyticsMigration).toContain("trades_initial_risk_positive_check");
    expect(analyticsMigration).not.toMatch(/\b(?:REAL|DOUBLE|DROP|TRUNCATE)\b/i);
  });

  it("adds step 17 playbooks and evidence-backed rule results", () => {
    const rulesMigration = readFileSync(
      resolve("prisma/migrations/20260728000400_step_17_behavior_rules/migration.sql"),
      "utf8"
    );
    expect(rulesMigration).toContain('CREATE TABLE "playbooks"');
    expect(rulesMigration).toContain('CREATE TABLE "playbook_rules"');
    expect(rulesMigration).toContain('CREATE TABLE "trade_rule_results"');
    expect(rulesMigration).toContain("'PASS', 'FAIL', 'UNKNOWN'");
    expect(rulesMigration).toContain('"evidence_id" UUID');
    expect(rulesMigration).toContain("trade_rule_results_confidence_check");
    expect(rulesMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
    const stopMigration = readFileSync(
      resolve("prisma/migrations/20260728000500_step_17_stop_evidence/migration.sql"),
      "utf8"
    );
    expect(stopMigration).toContain('CREATE TABLE "trade_stop_events"');
    expect(stopMigration).toContain("trade_stop_events_prices_nonnegative_check");
    expect(stopMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 19 candidates, confirmations, and exact model provenance", () => {
    const screenshotMigration = readFileSync(
      resolve("prisma/migrations/20260728000700_step_19_screenshot_parsing/migration.sql"),
      "utf8"
    );
    expect(screenshotMigration).toContain('CREATE TABLE "screenshot_parses"');
    expect(screenshotMigration).toContain('"candidates" JSONB NOT NULL');
    expect(screenshotMigration).toContain('"confirmed_data" JSONB');
    expect(screenshotMigration).toContain('"model_version" VARCHAR(100) NOT NULL');
    expect(screenshotMigration).toContain('"prompt_version" VARCHAR(50) NOT NULL');
    expect(screenshotMigration).toContain("screenshot_parses_confirmation_check");
    expect(screenshotMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores private step 20 voice metadata without transcription fields", () => {
    const voiceMigration = readFileSync(
      resolve("prisma/migrations/20260728000800_step_20_voice_recording/migration.sql"),
      "utf8"
    );
    expect(voiceMigration).toContain('CREATE TABLE "voice_recordings"');
    expect(voiceMigration).toContain('"duration_ms" INTEGER NOT NULL');
    expect(voiceMigration).toContain("voice_recordings_duration_check");
    expect(voiceMigration).toContain("voice_recordings_size_check");
    expect(voiceMigration).not.toMatch(/transcri|speech|DROP|TRUNCATE/i);
  });

  it("stores step 21 candidate and confirmed text with optional audio deletion", () => {
    const transcriptionMigration = readFileSync(
      resolve("prisma/migrations/20260728000900_step_21_voice_transcription/migration.sql"),
      "utf8"
    );
    expect(transcriptionMigration).toContain('CREATE TABLE "voice_transcriptions"');
    expect(transcriptionMigration).toContain('"candidate_text" TEXT NOT NULL');
    expect(transcriptionMigration).toContain('"confirmed_text" TEXT');
    expect(transcriptionMigration).toContain('"model_version" VARCHAR(100) NOT NULL');
    expect(transcriptionMigration).toContain('"prompt_version" VARCHAR(50) NOT NULL');
    expect(transcriptionMigration).toContain('"auto_delete_voice_after_transcription"');
    expect(transcriptionMigration).toContain('"object_deleted_at" TIMESTAMPTZ(3)');
    expect(transcriptionMigration).toContain("voice_transcriptions_confirmation_check");
    expect(transcriptionMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 22 behavioral extraction with explicit safety provenance", () => {
    const insightMigration = readFileSync(
      resolve("prisma/migrations/20260728001000_step_22_voice_insights/migration.sql"),
      "utf8"
    );
    expect(insightMigration).toContain('CREATE TABLE "voice_insight_extractions"');
    expect(insightMigration).toContain('"extracted_data" JSONB NOT NULL');
    expect(insightMigration).toContain('"model_version" VARCHAR(100) NOT NULL');
    expect(insightMigration).toContain('"prompt_version" VARCHAR(50) NOT NULL');
    expect(insightMigration).toContain('"safety_boundary" VARCHAR(255) NOT NULL');
    expect(insightMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("adds nullable step 23 execution-score filtering without implementing scoring", () => {
    const listMigration = readFileSync(
      resolve("prisma/migrations/20260728001100_step_23_trade_list/migration.sql"),
      "utf8"
    );
    expect(listMigration).toContain('ADD COLUMN "execution_score" SMALLINT');
    expect(listMigration).toContain("trades_execution_score_check");
    expect(listMigration).toContain("trades_user_id_execution_score_idx");
    expect(listMigration).not.toContain('"execution_score" SMALLINT NOT NULL');
    expect(listMigration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 25 result score with target, range and provenance constraints", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260728001300_step_25_result_score/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('"planned_target_r_multiple" DECIMAL(18,6)');
    expect(migration).toContain('"result_score" SMALLINT');
    expect(migration).toContain("trades_result_score_range_check");
    expect(migration).toContain("trades_result_score_provenance_check");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE|REAL|DOUBLE)\b/i);
  });

  it("adds step 26 execution-score provenance while preserving nullable UNKNOWN", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260728001400_step_26_execution_score/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('"execution_score_version" VARCHAR(32)');
    expect(migration).toContain('"execution_score_calculated_at" TIMESTAMPTZ(3)');
    expect(migration).toContain("trades_execution_score_provenance_check");
    expect(migration).toContain('"execution_score" IS NULL');
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 27 four-quadrant evaluation with an explicit UNKNOWN state", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260728001500_step_27_trade_quadrant/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('CREATE TYPE "TradeQuadrant"');
    expect(migration).toContain("'EXCELLENT'");
    expect(migration).toContain("'QUALIFIED'");
    expect(migration).toContain("'DANGEROUS'");
    expect(migration).toContain("'ERROR'");
    expect(migration).toContain("'UNKNOWN'");
    expect(migration).toContain("trades_quadrant_provenance_check");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 28 follow-up sessions with one active session and at most three rounds", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260728001600_step_28_follow_up/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('CREATE TABLE "follow_up_sessions"');
    expect(migration).toContain('CREATE TABLE "follow_up_turns"');
    expect(migration).toContain("follow_up_sessions_one_active_per_trade");
    expect(migration).toContain('"current_round" <= 3');
    expect(migration).toContain('"round" >= 1 AND "round" <= 3');
    expect(migration).toContain("follow_up_turns_answer_check");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores the step 29 structured review summary with tenant ownership and provenance", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260728001700_step_29_review_summary/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('CREATE TABLE "trade_review_summaries"');
    expect(migration).toContain('"summary" JSONB NOT NULL');
    expect(migration).toContain('"generator_version" VARCHAR(32) NOT NULL');
    expect(migration).toContain("trade_review_summaries_trade_user_fkey");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 30 reproducible evidence snapshots and invalidates them after trade edits", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260728001800_step_30_evidence_snapshots/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('CREATE TABLE "behavior_evidence_snapshots"');
    expect(migration).toContain('"input_data" JSONB NOT NULL');
    expect(migration).toContain('"output_data" JSONB NOT NULL');
    expect(migration).toContain("behavior_evidence_snapshots_one_current_pattern");
    expect(migration).toContain("invalidate_trade_evidence_snapshots");
    expect(migration).toContain("trades_invalidate_evidence_snapshots");
    expect(migration).toContain("'TRADE_MODIFIED'");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("records step 31 incremental and full pattern-detection runs with algorithm provenance", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260729000100_step_31_pattern_detection_jobs/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('CREATE TYPE "PatternDetectionMode"');
    expect(migration).toContain("'DAILY_INCREMENTAL'");
    expect(migration).toContain("'WEEKLY_FULL'");
    expect(migration).toContain('CREATE TABLE "pattern_detection_runs"');
    expect(migration).toContain('"algorithm_version" VARCHAR(32) NOT NULL');
    expect(migration).toContain("pattern_detection_runs_completion_check");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 32 confidence factors with count conservation and bounded metrics", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260729000200_step_32_pattern_confidence/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('CREATE TABLE "behavior_pattern_confidences"');
    expect(migration).toContain('"counterexample_count" INTEGER NOT NULL');
    expect(migration).toContain('"effect_size" DECIMAL(7,6) NOT NULL');
    expect(migration).toContain('"data_completeness" DECIMAL(7,6) NOT NULL');
    expect(migration).toContain("behavior_pattern_confidences_counts_check");
    expect(migration).toContain("behavior_pattern_confidences_ranges_check");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 33 schema-validated AI explanations with input and model provenance", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260729000300_step_33_pattern_explanations/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('CREATE TABLE "behavior_pattern_explanations"');
    expect(migration).toContain('"input_metric_ids" JSONB NOT NULL');
    expect(migration).toContain('"input_fingerprint" CHAR(64) NOT NULL');
    expect(migration).toContain('"model_version" VARCHAR(100) NOT NULL');
    expect(migration).toContain('"prompt_version" VARCHAR(50) NOT NULL');
    expect(migration).toContain("behavior_pattern_explanations_output_check");
    expect(migration).not.toMatch(/\b(?:DROP|TRUNCATE)\b/i);
  });

  it("stores step 35 AI corrections as immutable-target feedback without changing facts", () => {
    const migration = readFileSync(
      resolve("prisma/migrations/20260729000400_step_35_ai_corrections/migration.sql"),
      "utf8"
    );
    expect(migration).toContain('CREATE TYPE "PatternExplanationFeedbackReason"');
    expect(migration).toContain("'INACCURATE'");
    expect(migration).toContain("'UNHELPFUL'");
    expect(migration).toContain("'EVIDENCE_ERROR'");
    expect(migration).toContain("'TONE_INAPPROPRIATE'");
    expect(migration).toContain('"explanation_output_snapshot" JSONB NOT NULL');
    expect(migration).toContain('"explanation_input_fingerprint" CHAR(64) NOT NULL');
    expect(migration).toContain("ON DELETE RESTRICT");
    expect(migration).not.toMatch(/\b(?:UPDATE|DROP|TRUNCATE)\s+(?:trades|behavior_evidence)/i);
  });
});
