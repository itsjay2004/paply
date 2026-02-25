-- Add OpenAlex-related columns to papers (run in Supabase SQL Editor if you get
-- "could not find cited_by_count column" or similar when importing by DOI).

-- Add new columns (safe to run multiple times with IF NOT EXISTS)
ALTER TABLE papers ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE papers ADD COLUMN IF NOT EXISTS paper_url TEXT;
ALTER TABLE papers ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
ALTER TABLE papers ADD COLUMN IF NOT EXISTS cited_by_count INTEGER;
