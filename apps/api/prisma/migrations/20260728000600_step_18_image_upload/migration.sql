CREATE TYPE "ImageSource" AS ENUM ('CAMERA', 'LIBRARY');

CREATE TABLE "trade_images" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "trade_id" UUID,
  "object_key" VARCHAR(255) NOT NULL,
  "original_file_name" VARCHAR(255),
  "media_type" VARCHAR(64) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "source" "ImageSource" NOT NULL,
  "consented_at" TIMESTAMPTZ(3) NOT NULL,
  "exif_removed" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trade_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trade_images_object_key_key" ON "trade_images"("object_key");
CREATE INDEX "trade_images_user_id_created_at_idx" ON "trade_images"("user_id", "created_at");
CREATE INDEX "trade_images_trade_id_created_at_idx" ON "trade_images"("trade_id", "created_at");
ALTER TABLE "trade_images" ADD CONSTRAINT "trade_images_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trade_images" ADD CONSTRAINT "trade_images_trade_id_fkey"
  FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
