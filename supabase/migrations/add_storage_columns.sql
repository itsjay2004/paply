-- Per-user storage limit and usage (S3 PDFs). Default limit 500 MB.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT NOT NULL DEFAULT (500 * 1024 * 1024),
  ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT NOT NULL DEFAULT 0;

-- Store PDF size per paper for accurate storage decrement on delete/overwrite.
ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS pdf_size_bytes BIGINT;

-- Atomic increment/decrement for storage_used_bytes (avoids race conditions).
-- JWT 'sub' must match users.id (Clerk user id).
CREATE OR REPLACE FUNCTION public.increment_user_storage(delta BIGINT)
RETURNS void AS $$
DECLARE
  sub_id TEXT;
BEGIN
  sub_id := auth.jwt()->>'sub';
  IF sub_id IS NULL THEN RETURN; END IF;
  UPDATE public.users
  SET storage_used_bytes = GREATEST(0, storage_used_bytes + COALESCE(delta, 0))
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
