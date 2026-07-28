CREATE TYPE "FollowUpSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'MAX_ROUNDS');

CREATE TABLE "follow_up_sessions" (
  "id" UUID NOT NULL,
  "trade_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "FollowUpSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "current_round" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "completed_at" TIMESTAMPTZ(3),
  CONSTRAINT "follow_up_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "follow_up_turns" (
  "id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "round" INTEGER NOT NULL,
  "evidence_key" VARCHAR(50) NOT NULL,
  "source_rule_result_id" UUID,
  "question" VARCHAR(500) NOT NULL,
  "quick_options" JSONB NOT NULL,
  "selected_option" VARCHAR(100),
  "free_text" TEXT,
  "answered_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "follow_up_turns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "follow_up_sessions_one_active_per_trade"
  ON "follow_up_sessions"("trade_id") WHERE "status" = 'ACTIVE';
CREATE INDEX "follow_up_sessions_trade_id_created_at_idx"
  ON "follow_up_sessions"("trade_id", "created_at");
CREATE INDEX "follow_up_sessions_user_id_status_idx"
  ON "follow_up_sessions"("user_id", "status");
CREATE UNIQUE INDEX "follow_up_turns_session_id_round_key"
  ON "follow_up_turns"("session_id", "round");
CREATE INDEX "follow_up_turns_source_rule_result_id_idx"
  ON "follow_up_turns"("source_rule_result_id");

ALTER TABLE "follow_up_sessions" ADD CONSTRAINT "follow_up_sessions_round_check"
  CHECK ("current_round" >= 0 AND "current_round" <= 3);
ALTER TABLE "follow_up_turns" ADD CONSTRAINT "follow_up_turns_round_check"
  CHECK ("round" >= 1 AND "round" <= 3);
ALTER TABLE "follow_up_turns" ADD CONSTRAINT "follow_up_turns_answer_check"
  CHECK (
    ("answered_at" IS NULL AND "selected_option" IS NULL AND "free_text" IS NULL)
    OR
    ("answered_at" IS NOT NULL AND (("selected_option" IS NOT NULL)::int + ("free_text" IS NOT NULL)::int) = 1)
  );
ALTER TABLE "follow_up_sessions" ADD CONSTRAINT "follow_up_sessions_trade_id_user_id_fkey"
  FOREIGN KEY ("trade_id", "user_id") REFERENCES "trades"("id", "user_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "follow_up_sessions" ADD CONSTRAINT "follow_up_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "follow_up_turns" ADD CONSTRAINT "follow_up_turns_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "follow_up_sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
