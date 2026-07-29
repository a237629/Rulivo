CREATE TYPE "PatternDetectionMode" AS ENUM ('DAILY_INCREMENTAL', 'WEEKLY_FULL');
CREATE TYPE "PatternDetectionRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "pattern_detection_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mode" "PatternDetectionMode" NOT NULL,
  "status" "PatternDetectionRunStatus" NOT NULL DEFAULT 'RUNNING',
  "algorithm_version" VARCHAR(32) NOT NULL,
  "cutoff_at" TIMESTAMPTZ(3) NOT NULL,
  "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMPTZ(3),
  "processed_trades" INTEGER NOT NULL DEFAULT 0,
  "failed_trades" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  CONSTRAINT "pattern_detection_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pattern_detection_runs_counts_check"
    CHECK ("processed_trades" >= 0 AND "failed_trades" >= 0),
  CONSTRAINT "pattern_detection_runs_completion_check"
    CHECK (
      ("status" = 'RUNNING' AND "finished_at" IS NULL) OR
      ("status" <> 'RUNNING' AND "finished_at" IS NOT NULL)
    )
);

CREATE INDEX "pattern_detection_runs_mode_status_cutoff_idx"
  ON "pattern_detection_runs"("mode", "status", "cutoff_at");
