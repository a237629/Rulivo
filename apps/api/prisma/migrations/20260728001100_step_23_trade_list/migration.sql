ALTER TABLE "trades" ADD COLUMN "execution_score" SMALLINT;

ALTER TABLE "trades" ADD CONSTRAINT "trades_execution_score_check"
  CHECK ("execution_score" IS NULL OR ("execution_score" >= 0 AND "execution_score" <= 100));

CREATE INDEX "trades_user_id_execution_score_idx"
  ON "trades"("user_id", "execution_score");
