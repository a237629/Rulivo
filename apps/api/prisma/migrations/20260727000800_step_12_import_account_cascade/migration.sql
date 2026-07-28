-- Import batches are owned by a trading account and should be removed with it.
ALTER TABLE "csv_import_batches"
  DROP CONSTRAINT "csv_import_batches_trading_account_id_user_id_fkey";

ALTER TABLE "csv_import_batches"
  ADD CONSTRAINT "csv_import_batches_trading_account_id_user_id_fkey"
  FOREIGN KEY ("trading_account_id", "user_id")
  REFERENCES "trading_accounts"("id", "user_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
