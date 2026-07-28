CREATE TABLE "trade_review_summaries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trade_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "summary" JSONB NOT NULL,
  "generator_version" VARCHAR(32) NOT NULL,
  "generated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trade_review_summaries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trade_review_summaries_trade_id_key" UNIQUE ("trade_id"),
  CONSTRAINT "trade_review_summaries_trade_id_user_id_key" UNIQUE ("trade_id", "user_id"),
  CONSTRAINT "trade_review_summaries_trade_user_fkey"
    FOREIGN KEY ("trade_id", "user_id") REFERENCES "trades"("id", "user_id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trade_review_summaries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "trade_review_summaries_user_id_generated_at_idx"
  ON "trade_review_summaries"("user_id", "generated_at");
