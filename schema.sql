-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- From Clerk
    email TEXT,
    name TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections table for organizing papers
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFAULT (auth.jwt()->>'sub'),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Papers table to store PDF metadata
CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFAULT (auth.jwt()->>'sub'),
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    authors JSONB,
    publication_date DATE,
    doi TEXT UNIQUE,
    abstract TEXT,
    summary TEXT,
    pdf_url TEXT,
    work_type TEXT,
    language TEXT,
    source TEXT,
    paper_url TEXT,
    landing_page_url TEXT,
    cited_by_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Highlights table
CREATE TABLE highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFAULT (auth.jwt()->>'sub'),
    highlighted_text TEXT NOT NULL,
    explanation TEXT,
    "position" JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table for sticky notes
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFAULT (auth.jwt()->>'sub'),
    note_content TEXT NOT NULL,
    "position" JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp on papers table
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON papers
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Enable Row Level Security for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Clerk third-party auth: use JWT 'sub' claim = Clerk user ID)
CREATE POLICY "Users can manage their own data" ON users
FOR ALL USING ((auth.jwt()->>'sub') = id)
WITH CHECK ((auth.jwt()->>'sub') = id);

CREATE POLICY "Users can manage their own collections" ON collections
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users can manage their own papers" ON papers
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users can manage their own highlights" ON highlights
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users can manage their own notes" ON notes
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

-- Migration for existing DB (run in Supabase SQL Editor if papers table already exists):
-- Add new columns:
--   ALTER TABLE papers ADD COLUMN IF NOT EXISTS source TEXT;
--   ALTER TABLE papers ADD COLUMN IF NOT EXISTS paper_url TEXT;
--   ALTER TABLE papers ADD COLUMN IF NOT EXISTS landing_page_url TEXT;
--   ALTER TABLE papers ADD COLUMN IF NOT EXISTS cited_by_count INTEGER;
-- Remove old columns (optional, after adding new ones):
--   ALTER TABLE papers DROP COLUMN IF EXISTS publisher;
--   ALTER TABLE papers DROP COLUMN IF EXISTS publication_city;
--   ALTER TABLE papers DROP COLUMN IF EXISTS publication_country;
--   ALTER TABLE papers DROP COLUMN IF EXISTS raw_source_name;