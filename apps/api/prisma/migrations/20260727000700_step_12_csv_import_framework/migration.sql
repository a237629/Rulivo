-- CreateEnum
CREATE TYPE "CsvImportStatus" AS ENUM ('UPLOADED', 'MAPPED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "csv_import_batches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trading_account_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "content_hash" CHAR(64) NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "headers" JSONB NOT NULL,
    "mapping" JSONB,
    "mapping_options" JSONB,
    "status" "CsvImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "total_rows" INTEGER NOT NULL,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "confirmed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "csv_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csv_import_rows" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "normalized_data" JSONB,
    "validation_errors" JSONB,
    "is_valid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csv_import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csv_mapping_templates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "mapping" JSONB NOT NULL,
    "options" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "csv_mapping_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "csv_import_batches_user_id_content_hash_key"
  ON "csv_import_batches"("user_id", "content_hash");
CREATE INDEX "csv_import_batches_user_id_created_at_idx"
  ON "csv_import_batches"("user_id", "created_at");
CREATE INDEX "csv_import_batches_trading_account_id_created_at_idx"
  ON "csv_import_batches"("trading_account_id", "created_at");
CREATE UNIQUE INDEX "csv_import_rows_batch_id_row_number_key"
  ON "csv_import_rows"("batch_id", "row_number");
CREATE INDEX "csv_import_rows_batch_id_is_valid_idx"
  ON "csv_import_rows"("batch_id", "is_valid");
CREATE UNIQUE INDEX "csv_mapping_templates_user_id_name_key"
  ON "csv_mapping_templates"("user_id", "name");
CREATE INDEX "csv_mapping_templates_user_id_updated_at_idx"
  ON "csv_mapping_templates"("user_id", "updated_at");

-- AddForeignKey
ALTER TABLE "csv_import_batches"
  ADD CONSTRAINT "csv_import_batches_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "csv_import_batches"
  ADD CONSTRAINT "csv_import_batches_trading_account_id_user_id_fkey"
  FOREIGN KEY ("trading_account_id", "user_id")
  REFERENCES "trading_accounts"("id", "user_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "csv_import_rows"
  ADD CONSTRAINT "csv_import_rows_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "csv_import_batches"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "csv_mapping_templates"
  ADD CONSTRAINT "csv_mapping_templates_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Import safety and consistency invariants.
ALTER TABLE "csv_import_batches"
  ADD CONSTRAINT "csv_import_batches_hash_check"
  CHECK ("content_hash" ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "csv_import_batches_size_check"
  CHECK ("file_size_bytes" > 0 AND "file_size_bytes" <= 1048576),
  ADD CONSTRAINT "csv_import_batches_counts_check"
  CHECK (
    "total_rows" > 0
    AND "valid_rows" >= 0
    AND "error_rows" >= 0
    AND "valid_rows" + "error_rows" <= "total_rows"
  ),
  ADD CONSTRAINT "csv_import_batches_confirmed_check"
  CHECK (
    ("status" = 'CONFIRMED' AND "confirmed_at" IS NOT NULL)
    OR ("status" <> 'CONFIRMED' AND "confirmed_at" IS NULL)
  );

ALTER TABLE "csv_import_rows"
  ADD CONSTRAINT "csv_import_rows_number_check"
  CHECK ("row_number" > 1);
