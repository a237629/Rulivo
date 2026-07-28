CREATE TABLE "voice_insight_extractions" (
  "id" UUID NOT NULL,
  "voice_transcription_id" UUID NOT NULL,
  "extracted_data" JSONB NOT NULL,
  "model_version" VARCHAR(100) NOT NULL,
  "prompt_version" VARCHAR(50) NOT NULL,
  "safety_boundary" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "voice_insight_extractions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "voice_insight_extractions_voice_transcription_id_key"
  ON "voice_insight_extractions"("voice_transcription_id");
CREATE INDEX "voice_insight_extractions_created_at_idx"
  ON "voice_insight_extractions"("created_at");
ALTER TABLE "voice_insight_extractions"
  ADD CONSTRAINT "voice_insight_extractions_voice_transcription_id_fkey"
  FOREIGN KEY ("voice_transcription_id") REFERENCES "voice_transcriptions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
