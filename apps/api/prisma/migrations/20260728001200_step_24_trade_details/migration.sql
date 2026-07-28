CREATE UNIQUE INDEX "trades_id_user_id_key" ON "trades"("id", "user_id");

CREATE TABLE "trade_notes" (
    "id" UUID NOT NULL,
    "trade_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "trade_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trade_notes_trade_id_created_at_idx" ON "trade_notes"("trade_id", "created_at");
CREATE INDEX "trade_notes_user_id_updated_at_idx" ON "trade_notes"("user_id", "updated_at");
ALTER TABLE "trade_notes" ADD CONSTRAINT "trade_notes_trade_id_user_id_fkey"
  FOREIGN KEY ("trade_id", "user_id") REFERENCES "trades"("id", "user_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trade_notes" ADD CONSTRAINT "trade_notes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
