ALTER TABLE "trades"
ADD COLUMN "initial_risk_minor" BIGINT,
ADD COLUMN "analytics_calculated_at" TIMESTAMPTZ(3);

ALTER TABLE "trades"
ADD CONSTRAINT "trades_initial_risk_positive_check"
CHECK ("initial_risk_minor" IS NULL OR "initial_risk_minor" > 0);
