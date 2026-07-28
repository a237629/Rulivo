CREATE TYPE "TradeQuadrant" AS ENUM (
  'EXCELLENT',
  'QUALIFIED',
  'DANGEROUS',
  'ERROR',
  'UNKNOWN'
);

ALTER TABLE "trades"
  ADD COLUMN "quadrant_evaluation" "TradeQuadrant",
  ADD COLUMN "quadrant_version" VARCHAR(32),
  ADD COLUMN "quadrant_calculated_at" TIMESTAMPTZ(3);

ALTER TABLE "trades" ADD CONSTRAINT "trades_quadrant_provenance_check"
  CHECK (
    ("quadrant_evaluation" IS NULL AND "quadrant_version" IS NULL AND "quadrant_calculated_at" IS NULL)
    OR
    ("quadrant_evaluation" IS NOT NULL AND "quadrant_version" IS NOT NULL AND "quadrant_calculated_at" IS NOT NULL)
  );

CREATE INDEX "trades_user_id_quadrant_evaluation_idx"
  ON "trades"("user_id", "quadrant_evaluation");
