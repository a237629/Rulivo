ALTER TABLE "trades"
  ADD COLUMN "execution_score_version" VARCHAR(32),
  ADD COLUMN "execution_score_calculated_at" TIMESTAMPTZ(3);

ALTER TABLE "trades" ADD CONSTRAINT "trades_execution_score_provenance_check"
  CHECK (
    ("execution_score" IS NULL AND "execution_score_version" IS NULL AND "execution_score_calculated_at" IS NULL)
    OR
    ("execution_score" IS NOT NULL AND "execution_score_version" IS NOT NULL AND "execution_score_calculated_at" IS NOT NULL)
  );
