ALTER TABLE "trades"
  ADD COLUMN "planned_target_r_multiple" DECIMAL(18,6),
  ADD COLUMN "result_score" SMALLINT,
  ADD COLUMN "result_score_version" VARCHAR(32),
  ADD COLUMN "result_score_calculated_at" TIMESTAMPTZ(3);

ALTER TABLE "trades" ADD CONSTRAINT "trades_planned_target_r_positive_check"
  CHECK ("planned_target_r_multiple" IS NULL OR "planned_target_r_multiple" > 0);
ALTER TABLE "trades" ADD CONSTRAINT "trades_result_score_range_check"
  CHECK ("result_score" IS NULL OR ("result_score" >= 0 AND "result_score" <= 100));
ALTER TABLE "trades" ADD CONSTRAINT "trades_result_score_provenance_check"
  CHECK (
    ("result_score" IS NULL AND "result_score_version" IS NULL AND "result_score_calculated_at" IS NULL)
    OR
    ("result_score" IS NOT NULL AND "result_score_version" IS NOT NULL AND "result_score_calculated_at" IS NOT NULL)
  );

CREATE INDEX "trades_user_id_result_score_idx" ON "trades"("user_id", "result_score");
