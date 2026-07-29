CREATE TABLE "behavior_pattern_explanations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "input_metric_ids" JSONB NOT NULL,
    "input_fingerprint" CHAR(64) NOT NULL,
    "output" JSONB NOT NULL,
    "model_version" VARCHAR(100) NOT NULL,
    "prompt_version" VARCHAR(50) NOT NULL,
    "generated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "behavior_pattern_explanations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "behavior_pattern_explanations_input_metric_ids_check" CHECK (
      jsonb_typeof("input_metric_ids") = 'array'
      AND jsonb_array_length("input_metric_ids") BETWEEN 1 AND 5
    ),
    CONSTRAINT "behavior_pattern_explanations_output_check" CHECK (
      jsonb_typeof("output") = 'object'
      AND jsonb_typeof("output"->'explanations') = 'array'
    )
);

CREATE UNIQUE INDEX "behavior_pattern_explanations_user_id_key"
ON "behavior_pattern_explanations"("user_id");
CREATE INDEX "behavior_pattern_explanations_generated_at_idx"
ON "behavior_pattern_explanations"("generated_at");

ALTER TABLE "behavior_pattern_explanations"
ADD CONSTRAINT "behavior_pattern_explanations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
