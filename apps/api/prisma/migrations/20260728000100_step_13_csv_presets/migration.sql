ALTER TABLE "csv_import_batches"
ADD COLUMN "preset_id" VARCHAR(32);

ALTER TABLE "csv_import_batches"
ADD CONSTRAINT "csv_import_batches_preset_id_check"
CHECK (
  "preset_id" IS NULL OR
  "preset_id" IN ('BINANCE', 'OKX', 'BYBIT', 'INTERACTIVE_BROKERS', 'GENERIC')
);

CREATE INDEX "csv_import_batches_preset_id_idx"
ON "csv_import_batches" ("preset_id");
