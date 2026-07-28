CREATE TYPE "BehaviorRuleType" AS ENUM (
  'LOSS_REENTRY',
  'POSITION_INCREASE',
  'MOVED_STOP',
  'DAILY_TRADE_LIMIT',
  'PLAN_DEVIATION'
);
CREATE TYPE "RuleEvaluationStatus" AS ENUM ('PASS', 'FAIL', 'UNKNOWN');
CREATE TYPE "RuleEvidenceType" AS ENUM ('TRADE', 'METRIC', 'MISSING_DATA');

CREATE TABLE "playbooks" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "playbook_rules" (
  "id" UUID NOT NULL,
  "playbook_id" UUID NOT NULL,
  "type" "BehaviorRuleType" NOT NULL,
  "config" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "playbook_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trade_rule_results" (
  "id" UUID NOT NULL,
  "trade_id" UUID NOT NULL,
  "playbook_rule_id" UUID NOT NULL,
  "status" "RuleEvaluationStatus" NOT NULL,
  "evidence_type" "RuleEvidenceType" NOT NULL,
  "evidence_id" UUID,
  "explanation" VARCHAR(500) NOT NULL,
  "confidence" DECIMAL(4,3) NOT NULL,
  "algorithm_version" VARCHAR(32) NOT NULL,
  "evaluated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trade_rule_results_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "trades" ADD COLUMN "playbook_id" UUID;

CREATE UNIQUE INDEX "playbooks_user_id_name_key" ON "playbooks"("user_id", "name");
CREATE INDEX "playbooks_user_id_is_active_idx" ON "playbooks"("user_id", "is_active");
CREATE UNIQUE INDEX "playbook_rules_playbook_id_type_key" ON "playbook_rules"("playbook_id", "type");
CREATE INDEX "playbook_rules_type_enabled_idx" ON "playbook_rules"("type", "enabled");
CREATE UNIQUE INDEX "trade_rule_results_trade_id_playbook_rule_id_key"
ON "trade_rule_results"("trade_id", "playbook_rule_id");
CREATE INDEX "trade_rule_results_trade_id_status_idx" ON "trade_rule_results"("trade_id", "status");
CREATE INDEX "trades_playbook_id_idx" ON "trades"("playbook_id");

ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playbook_rules" ADD CONSTRAINT "playbook_rules_playbook_id_fkey"
FOREIGN KEY ("playbook_id") REFERENCES "playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trade_rule_results" ADD CONSTRAINT "trade_rule_results_trade_id_fkey"
FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trade_rule_results" ADD CONSTRAINT "trade_rule_results_playbook_rule_id_fkey"
FOREIGN KEY ("playbook_rule_id") REFERENCES "playbook_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trades" ADD CONSTRAINT "trades_playbook_id_fkey"
FOREIGN KEY ("playbook_id") REFERENCES "playbooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "trade_rule_results" ADD CONSTRAINT "trade_rule_results_confidence_check"
CHECK ("confidence" >= 0 AND "confidence" <= 1);
