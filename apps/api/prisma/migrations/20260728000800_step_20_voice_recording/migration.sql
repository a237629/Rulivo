CREATE TABLE "voice_recordings" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "trade_id" UUID,
  "object_key" VARCHAR(255) NOT NULL,
  "media_type" VARCHAR(64) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "duration_ms" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "voice_recordings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "voice_recordings_size_check" CHECK ("size_bytes" > 0 AND "size_bytes" <= 26214400),
  CONSTRAINT "voice_recordings_duration_check" CHECK ("duration_ms" > 0 AND "duration_ms" <= 3600000)
);

CREATE UNIQUE INDEX "voice_recordings_object_key_key" ON "voice_recordings"("object_key");
CREATE INDEX "voice_recordings_user_id_created_at_idx" ON "voice_recordings"("user_id", "created_at");
CREATE INDEX "voice_recordings_trade_id_created_at_idx" ON "voice_recordings"("trade_id", "created_at");
ALTER TABLE "voice_recordings" ADD CONSTRAINT "voice_recordings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_recordings" ADD CONSTRAINT "voice_recordings_trade_id_fkey"
  FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
