-- Starred papers: user can mark papers as starred for quick access.
-- Run in Supabase SQL Editor or via migration.
ALTER TABLE papers ADD COLUMN IF NOT EXISTS starred BOOLEAN NOT NULL DEFAULT false;
