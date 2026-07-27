-- CreateEnum
CREATE TYPE "TradingMarket" AS ENUM ('CHINA', 'HONG_KONG', 'UNITED_STATES', 'FOREX', 'CRYPTO', 'FUTURES');

-- CreateEnum
CREATE TYPE "RiskUnit" AS ENUM ('PERCENT_OF_EQUITY', 'FIXED_AMOUNT', 'R_MULTIPLE');

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "default_market" "TradingMarket" NOT NULL DEFAULT 'UNITED_STATES',
ADD COLUMN     "onboarding_completed_at" TIMESTAMPTZ(3),
ADD COLUMN     "risk_unit" "RiskUnit" NOT NULL DEFAULT 'PERCENT_OF_EQUITY';

-- Preference integrity constraints.
ALTER TABLE "user_profiles"
  ADD CONSTRAINT "user_profiles_locale_check"
  CHECK ("locale" IN ('zh-CN', 'en-US')),
  ADD CONSTRAINT "user_profiles_time_zone_check"
  CHECK (length(trim("time_zone")) > 0);
