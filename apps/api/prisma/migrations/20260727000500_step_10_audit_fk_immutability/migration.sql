-- Keep audit rows immutable to direct writes while allowing PostgreSQL's
-- ON DELETE SET NULL foreign-key actions to detach deleted users.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'audit_logs are immutable' USING ERRCODE = '55000';
END;
$$;
