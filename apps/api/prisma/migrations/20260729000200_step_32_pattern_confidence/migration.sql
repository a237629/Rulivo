CREATE TYPE "PatternConfidenceLevel" AS ENUM ('INSUFFICIENT', 'LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "PatternDominantStatus" AS ENUM ('UNKNOWN', 'BALANCED', 'PASS', 'FAIL');

CREATE TABLE "behavior_pattern_confidences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "pattern_type" "BehaviorRuleType" NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "known_sample_size" INTEGER NOT NULL,
    "pass_count" INTEGER NOT NULL,
    "fail_count" INTEGER NOT NULL,
    "unknown_count" INTEGER NOT NULL,
    "counterexample_count" INTEGER NOT NULL,
    "dominant_status" "PatternDominantStatus" NOT NULL,
    "effect_size" DECIMAL(7,6) NOT NULL,
    "data_completeness" DECIMAL(7,6) NOT NULL,
    "confidence_score" SMALLINT NOT NULL,
    "level" "PatternConfidenceLevel" NOT NULL,
    "algorithm_version" VARCHAR(32) NOT NULL,
    "source_run_id" UUID,
    "calculated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "behavior_pattern_confidences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "behavior_pattern_confidences_counts_check" CHECK (
      "sample_size" >= 0
      AND "known_sample_size" >= 0
      AND "pass_count" >= 0
      AND "fail_count" >= 0
      AND "unknown_count" >= 0
      AND "counterexample_count" >= 0
      AND "known_sample_size" = "pass_count" + "fail_count"
      AND "sample_size" = "known_sample_size" + "unknown_count"
      AND "counterexample_count" <= "known_sample_size"
    ),
    CONSTRAINT "behavior_pattern_confidences_ranges_check" CHECK (
      "effect_size" BETWEEN -1 AND 1
      AND "data_completeness" BETWEEN 0 AND 1
      AND "confidence_score" BETWEEN 0 AND 100
    )
);

CREATE UNIQUE INDEX "behavior_pattern_confidences_user_id_pattern_type_key"
ON "behavior_pattern_confidences"("user_id", "pattern_type");
CREATE INDEX "behavior_pattern_confidences_user_id_level_idx"
ON "behavior_pattern_confidences"("user_id", "level");
CREATE INDEX "behavior_pattern_confidences_source_run_id_idx"
ON "behavior_pattern_confidences"("source_run_id");

ALTER TABLE "behavior_pattern_confidences"
ADD CONSTRAINT "behavior_pattern_confidences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "behavior_pattern_confidences"
ADD CONSTRAINT "behavior_pattern_confidences_source_run_id_fkey"
FOREIGN KEY ("source_run_id") REFERENCES "pattern_detection_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
