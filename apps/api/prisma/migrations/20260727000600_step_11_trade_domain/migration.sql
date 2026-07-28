-- CreateEnum
CREATE TYPE "ExecutionAction" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('COMMISSION', 'EXCHANGE', 'REGULATORY', 'TAX', 'OTHER');

-- CreateTable
CREATE TABLE "instruments" (
    "id" UUID NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "market" VARCHAR(32) NOT NULL,
    "name" VARCHAR(200),
    "asset_class" VARCHAR(50),
    "currency" CHAR(3) NOT NULL,
    "price_scale" SMALLINT NOT NULL DEFAULT 2,
    "quantity_scale" SMALLINT NOT NULL DEFAULT 10,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- Add the relation as nullable while existing trade rows are backfilled.
ALTER TABLE "trades" ADD COLUMN "instrument_id" UUID;

-- Preserve every existing trade by deriving one canonical instrument for each
-- market/symbol pair. UNKNOWN keeps legacy rows with no market addressable.
INSERT INTO "instruments" (
    "id",
    "symbol",
    "market",
    "currency",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "symbol",
    COALESCE("market", 'UNKNOWN'),
    MIN("currency"),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "trades"
GROUP BY "symbol", COALESCE("market", 'UNKNOWN')
ON CONFLICT DO NOTHING;

UPDATE "trades" AS trade
SET "instrument_id" = instrument."id"
FROM "instruments" AS instrument
WHERE instrument."symbol" = trade."symbol"
  AND instrument."market" = COALESCE(trade."market", 'UNKNOWN');

ALTER TABLE "trades" ALTER COLUMN "instrument_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "executions" (
    "id" UUID NOT NULL,
    "trade_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "action" "ExecutionAction" NOT NULL,
    "executed_at" TIMESTAMPTZ(3) NOT NULL,
    "quantity" DECIMAL(30,10) NOT NULL,
    "price_minor" BIGINT NOT NULL,
    "external_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fees" (
    "id" UUID NOT NULL,
    "trade_id" UUID NOT NULL,
    "execution_id" UUID,
    "type" "FeeType" NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instruments_market_symbol_key" ON "instruments"("market", "symbol");
CREATE INDEX "instruments_symbol_idx" ON "instruments"("symbol");
CREATE INDEX "trades_instrument_id_opened_at_idx" ON "trades"("instrument_id", "opened_at");
CREATE UNIQUE INDEX "executions_trade_id_sequence_key" ON "executions"("trade_id", "sequence");
CREATE UNIQUE INDEX "executions_id_trade_id_key" ON "executions"("id", "trade_id");
CREATE INDEX "executions_trade_id_executed_at_idx" ON "executions"("trade_id", "executed_at");
CREATE INDEX "fees_trade_id_idx" ON "fees"("trade_id");
CREATE INDEX "fees_execution_id_idx" ON "fees"("execution_id");

-- AddForeignKey
ALTER TABLE "trades"
  ADD CONSTRAINT "trades_instrument_id_fkey"
  FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "executions"
  ADD CONSTRAINT "executions_trade_id_fkey"
  FOREIGN KEY ("trade_id") REFERENCES "trades"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fees"
  ADD CONSTRAINT "fees_trade_id_fkey"
  FOREIGN KEY ("trade_id") REFERENCES "trades"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fees"
  ADD CONSTRAINT "fees_execution_id_trade_id_fkey"
  FOREIGN KEY ("execution_id", "trade_id") REFERENCES "executions"("id", "trade_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain invariants not expressible in the Prisma schema.
ALTER TABLE "instruments"
  ADD CONSTRAINT "instruments_currency_check"
  CHECK ("currency" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "instruments_scale_check"
  CHECK ("price_scale" BETWEEN 0 AND 12 AND "quantity_scale" BETWEEN 0 AND 10);

ALTER TABLE "executions"
  ADD CONSTRAINT "executions_sequence_positive_check"
  CHECK ("sequence" > 0),
  ADD CONSTRAINT "executions_quantity_positive_check"
  CHECK ("quantity" > 0),
  ADD CONSTRAINT "executions_price_nonnegative_check"
  CHECK ("price_minor" >= 0);

ALTER TABLE "fees"
  ADD CONSTRAINT "fees_amount_nonnegative_check"
  CHECK ("amount_minor" >= 0),
  ADD CONSTRAINT "fees_currency_check"
  CHECK ("currency" ~ '^[A-Z]{3}$');
