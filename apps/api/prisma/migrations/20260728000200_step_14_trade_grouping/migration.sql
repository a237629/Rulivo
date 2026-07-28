ALTER TABLE "csv_import_batches"
ADD COLUMN "grouped_at" TIMESTAMPTZ(3);

ALTER TABLE "trades"
ADD COLUMN "import_batch_id" UUID;

CREATE TABLE "csv_import_execution_sources" (
    "id" UUID NOT NULL,
    "csv_import_row_id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "allocated_quantity" DECIMAL(30,10) NOT NULL,
    "allocated_fee_minor" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csv_import_execution_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "csv_import_execution_sources_execution_id_key"
ON "csv_import_execution_sources"("execution_id");

CREATE INDEX "csv_import_execution_sources_csv_import_row_id_idx"
ON "csv_import_execution_sources"("csv_import_row_id");

CREATE INDEX "trades_import_batch_id_idx"
ON "trades"("import_batch_id");

ALTER TABLE "trades"
ADD CONSTRAINT "trades_import_batch_id_fkey"
FOREIGN KEY ("import_batch_id") REFERENCES "csv_import_batches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "csv_import_execution_sources"
ADD CONSTRAINT "csv_import_execution_sources_csv_import_row_id_fkey"
FOREIGN KEY ("csv_import_row_id") REFERENCES "csv_import_rows"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "csv_import_execution_sources"
ADD CONSTRAINT "csv_import_execution_sources_execution_id_fkey"
FOREIGN KEY ("execution_id") REFERENCES "executions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "csv_import_execution_sources"
ADD CONSTRAINT "csv_import_execution_sources_quantity_positive_check"
CHECK ("allocated_quantity" > 0);

ALTER TABLE "csv_import_execution_sources"
ADD CONSTRAINT "csv_import_execution_sources_fee_nonnegative_check"
CHECK ("allocated_fee_minor" >= 0);
