-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'SUPPORT', 'ANALYST', 'ADMIN');

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_email" VARCHAR(320) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(100) NOT NULL,
    "target_user_id" UUID,
    "target_identifier" VARCHAR(320) NOT NULL,
    "metadata" JSONB,
    "request_id" VARCHAR(128) NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_role_assignments_role_idx" ON "user_role_assignments"("role");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_user_id_created_at_idx" ON "audit_logs"("target_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing and future accounts always have the baseline USER role.
INSERT INTO "user_role_assignments" ("user_id", "role")
SELECT "id", 'USER'::"Role"
FROM "users"
ON CONFLICT ("user_id", "role") DO NOTHING;

-- Audit evidence is append-only, including for application database credentials.
CREATE FUNCTION prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Permit PostgreSQL's own ON DELETE SET NULL referential action while
  -- continuing to reject direct application updates and all deletes.
  IF TG_OP = 'UPDATE' AND pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'audit_logs are immutable' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
