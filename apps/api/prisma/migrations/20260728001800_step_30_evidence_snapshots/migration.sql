CREATE TABLE "behavior_evidence_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trade_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "pattern_type" "BehaviorRuleType" NOT NULL,
  "input_data" JSONB NOT NULL,
  "output_data" JSONB NOT NULL,
  "algorithm_version" VARCHAR(32) NOT NULL,
  "source_trade_updated_at" TIMESTAMPTZ(3) NOT NULL,
  "computed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "invalidated_at" TIMESTAMPTZ(3),
  "invalidation_reason" VARCHAR(100),
  CONSTRAINT "behavior_evidence_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "behavior_evidence_snapshots_trade_user_fkey"
    FOREIGN KEY ("trade_id", "user_id") REFERENCES "trades"("id", "user_id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "behavior_evidence_snapshots_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "behavior_evidence_snapshots_invalidation_check"
    CHECK (
      ("invalidated_at" IS NULL AND "invalidation_reason" IS NULL) OR
      ("invalidated_at" IS NOT NULL AND "invalidation_reason" IS NOT NULL)
    )
);

CREATE INDEX "behavior_evidence_snapshots_trade_pattern_computed_idx"
  ON "behavior_evidence_snapshots"("trade_id", "pattern_type", "computed_at");
CREATE INDEX "behavior_evidence_snapshots_user_invalidated_idx"
  ON "behavior_evidence_snapshots"("user_id", "invalidated_at");
CREATE UNIQUE INDEX "behavior_evidence_snapshots_one_current_pattern"
  ON "behavior_evidence_snapshots"("trade_id", "pattern_type")
  WHERE "invalidated_at" IS NULL;

CREATE OR REPLACE FUNCTION invalidate_trade_evidence_snapshots()
RETURNS TRIGGER AS $$
BEGIN
  IF
    OLD."trading_account_id" IS DISTINCT FROM NEW."trading_account_id" OR
    OLD."instrument_id" IS DISTINCT FROM NEW."instrument_id" OR
    OLD."playbook_id" IS DISTINCT FROM NEW."playbook_id" OR
    OLD."symbol" IS DISTINCT FROM NEW."symbol" OR
    OLD."market" IS DISTINCT FROM NEW."market" OR
    OLD."side" IS DISTINCT FROM NEW."side" OR
    OLD."opened_at" IS DISTINCT FROM NEW."opened_at" OR
    OLD."closed_at" IS DISTINCT FROM NEW."closed_at" OR
    OLD."quantity" IS DISTINCT FROM NEW."quantity" OR
    OLD."entry_price_minor" IS DISTINCT FROM NEW."entry_price_minor" OR
    OLD."exit_price_minor" IS DISTINCT FROM NEW."exit_price_minor" OR
    OLD."currency" IS DISTINCT FROM NEW."currency" OR
    OLD."realized_pnl_minor" IS DISTINCT FROM NEW."realized_pnl_minor" OR
    OLD."initial_risk_minor" IS DISTINCT FROM NEW."initial_risk_minor" OR
    OLD."source" IS DISTINCT FROM NEW."source" OR
    OLD."status" IS DISTINCT FROM NEW."status"
  THEN
    UPDATE "behavior_evidence_snapshots"
    SET
      "invalidated_at" = CURRENT_TIMESTAMP,
      "invalidation_reason" = 'TRADE_MODIFIED'
    WHERE "trade_id" = NEW."id" AND "invalidated_at" IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trades_invalidate_evidence_snapshots"
AFTER UPDATE ON "trades"
FOR EACH ROW
EXECUTE FUNCTION invalidate_trade_evidence_snapshots();
