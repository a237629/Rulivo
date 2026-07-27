-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TradeSource" AS ENUM ('MANUAL', 'CSV', 'SCREENSHOT', 'API');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('APP_STORE', 'STRIPE', 'WECHAT_PAY', 'ALIPAY', 'MANUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'GRACE_PERIOD', 'CANCELED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(100),
    "locale" VARCHAR(16) NOT NULL DEFAULT 'zh-CN',
    "time_zone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "default_currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "trading_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(100),
    "account_type" VARCHAR(50),
    "base_currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "trading_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trading_account_id" UUID NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "market" VARCHAR(32),
    "side" "TradeSide" NOT NULL,
    "opened_at" TIMESTAMPTZ(3) NOT NULL,
    "closed_at" TIMESTAMPTZ(3),
    "quantity" DECIMAL(30,10) NOT NULL,
    "entry_price_minor" BIGINT NOT NULL,
    "exit_price_minor" BIGINT,
    "currency" CHAR(3) NOT NULL,
    "realized_pnl_minor" BIGINT,
    "r_multiple" DECIMAL(18,6),
    "source" "TradeSource" NOT NULL DEFAULT 'MANUAL',
    "status" "TradeStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "payment_provider" "PaymentProvider" NOT NULL,
    "provider_customer_id" VARCHAR(255),
    "provider_transaction_id" VARCHAR(255),
    "product_code" VARCHAR(100) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "current_period_start" TIMESTAMPTZ(3),
    "current_period_end" TIMESTAMPTZ(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "environment" "SubscriptionEnvironment" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "trading_accounts_user_id_idx" ON "trading_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trading_accounts_user_id_name_key" ON "trading_accounts"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "trading_accounts_id_user_id_key" ON "trading_accounts"("id", "user_id");

-- CreateIndex
CREATE INDEX "trades_user_id_opened_at_idx" ON "trades"("user_id", "opened_at");

-- CreateIndex
CREATE INDEX "trades_trading_account_id_opened_at_idx" ON "trades"("trading_account_id", "opened_at");

-- CreateIndex
CREATE INDEX "trades_status_idx" ON "trades"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_provider_transaction_id_key" ON "subscriptions"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_status_idx" ON "subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_trading_account_id_user_id_fkey" FOREIGN KEY ("trading_account_id", "user_id") REFERENCES "trading_accounts"("id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain invariants not expressible in the Prisma schema.
ALTER TABLE "user_profiles"
  ADD CONSTRAINT "user_profiles_default_currency_check"
  CHECK ("default_currency" ~ '^[A-Z]{3}$');

ALTER TABLE "trading_accounts"
  ADD CONSTRAINT "trading_accounts_base_currency_check"
  CHECK ("base_currency" ~ '^[A-Z]{3}$');

ALTER TABLE "trades"
  ADD CONSTRAINT "trades_currency_check"
  CHECK ("currency" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "trades_quantity_positive_check"
  CHECK ("quantity" > 0),
  ADD CONSTRAINT "trades_price_nonnegative_check"
  CHECK ("entry_price_minor" >= 0 AND ("exit_price_minor" IS NULL OR "exit_price_minor" >= 0)),
  ADD CONSTRAINT "trades_closed_at_check"
  CHECK ("closed_at" IS NULL OR "closed_at" >= "opened_at");
