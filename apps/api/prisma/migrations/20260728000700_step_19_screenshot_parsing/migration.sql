CREATE TYPE "ScreenshotParseStatus" AS ENUM ('CANDIDATE', 'CONFIRMED');

CREATE TABLE "screenshot_parses" (
  "id" UUID NOT NULL,
  "trade_image_id" UUID NOT NULL,
  "status" "ScreenshotParseStatus" NOT NULL DEFAULT 'CANDIDATE',
  "candidates" JSONB NOT NULL,
  "confirmed_data" JSONB,
  "model_version" VARCHAR(100) NOT NULL,
  "prompt_version" VARCHAR(50) NOT NULL,
  "confirmed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "screenshot_parses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "screenshot_parses_trade_image_id_created_at_idx"
  ON "screenshot_parses"("trade_image_id", "created_at");

ALTER TABLE "screenshot_parses" ADD CONSTRAINT "screenshot_parses_trade_image_id_fkey"
  FOREIGN KEY ("trade_image_id") REFERENCES "trade_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "screenshot_parses" ADD CONSTRAINT "screenshot_parses_confirmation_check"
  CHECK (
    ("status" = 'CANDIDATE' AND "confirmed_data" IS NULL AND "confirmed_at" IS NULL)
    OR
    ("status" = 'CONFIRMED' AND "confirmed_data" IS NOT NULL AND "confirmed_at" IS NOT NULL)
  );
