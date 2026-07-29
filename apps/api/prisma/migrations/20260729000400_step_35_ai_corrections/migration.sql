CREATE TYPE "PatternExplanationFeedbackReason" AS ENUM (
  'INACCURATE',
  'UNHELPFUL',
  'EVIDENCE_ERROR',
  'TONE_INAPPROPRIATE'
);

CREATE TABLE "pattern_explanation_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "explanation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pattern_type" "BehaviorRuleType" NOT NULL,
    "reason" "PatternExplanationFeedbackReason" NOT NULL,
    "comment" VARCHAR(1000),
    "explanation_output_snapshot" JSONB NOT NULL,
    "explanation_input_fingerprint" CHAR(64) NOT NULL,
    "model_version" VARCHAR(100) NOT NULL,
    "prompt_version" VARCHAR(50) NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pattern_explanation_feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pattern_explanation_feedback_output_check" CHECK (
      jsonb_typeof("explanation_output_snapshot") = 'object'
    )
);

CREATE UNIQUE INDEX "pattern_explanation_feedback_unique_submission"
ON "pattern_explanation_feedback"(
  "user_id",
  "explanation_id",
  "pattern_type",
  "reason",
  "explanation_input_fingerprint"
);
CREATE INDEX "pattern_explanation_feedback_explanation_id_submitted_at_idx"
ON "pattern_explanation_feedback"("explanation_id", "submitted_at");
CREATE INDEX "pattern_explanation_feedback_user_id_submitted_at_idx"
ON "pattern_explanation_feedback"("user_id", "submitted_at");

ALTER TABLE "pattern_explanation_feedback"
ADD CONSTRAINT "pattern_explanation_feedback_explanation_id_fkey"
FOREIGN KEY ("explanation_id") REFERENCES "behavior_pattern_explanations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pattern_explanation_feedback"
ADD CONSTRAINT "pattern_explanation_feedback_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
