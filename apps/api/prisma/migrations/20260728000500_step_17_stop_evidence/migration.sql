CREATE TABLE "trade_stop_events" (
  "id" UUID NOT NULL,
  "trade_id" UUID NOT NULL,
  "previous_stop_price_minor" BIGINT NOT NULL,
  "new_stop_price_minor" BIGINT NOT NULL,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trade_stop_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trade_stop_events_trade_id_occurred_at_idx"
ON "trade_stop_events"("trade_id", "occurred_at");

ALTER TABLE "trade_stop_events"
ADD CONSTRAINT "trade_stop_events_trade_id_fkey"
FOREIGN KEY ("trade_id") REFERENCES "trades"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trade_stop_events"
ADD CONSTRAINT "trade_stop_events_prices_nonnegative_check"
CHECK ("previous_stop_price_minor" >= 0 AND "new_stop_price_minor" >= 0);
