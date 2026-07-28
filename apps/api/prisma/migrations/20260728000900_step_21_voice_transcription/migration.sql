CREATE TYPE "VoiceTranscriptionStatus" AS ENUM ('CANDIDATE', 'CONFIRMED');

ALTER TABLE "user_profiles"
  ADD COLUMN "auto_delete_voice_after_transcription" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "voice_recordings"
  ADD COLUMN "object_deleted_at" TIMESTAMPTZ(3);

CREATE TABLE "voice_transcriptions" (
  "id" UUID NOT NULL,
  "voice_recording_id" UUID NOT NULL,
  "status" "VoiceTranscriptionStatus" NOT NULL DEFAULT 'CANDIDATE',
  "candidate_text" TEXT NOT NULL,
  "confirmed_text" TEXT,
  "model_version" VARCHAR(100) NOT NULL,
  "prompt_version" VARCHAR(50) NOT NULL,
  "confirmed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "voice_transcriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "voice_transcriptions_confirmation_check" CHECK (
    ("status" = 'CANDIDATE' AND "confirmed_text" IS NULL AND "confirmed_at" IS NULL)
    OR
    ("status" = 'CONFIRMED' AND "confirmed_text" IS NOT NULL AND "confirmed_at" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "voice_transcriptions_voice_recording_id_key"
  ON "voice_transcriptions"("voice_recording_id");
CREATE INDEX "voice_transcriptions_status_created_at_idx"
  ON "voice_transcriptions"("status", "created_at");
ALTER TABLE "voice_transcriptions" ADD CONSTRAINT "voice_transcriptions_voice_recording_id_fkey"
  FOREIGN KEY ("voice_recording_id") REFERENCES "voice_recordings"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
