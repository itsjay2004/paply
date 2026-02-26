-- Notebook notes: standalone notes with Tiptap JSON content.
-- Run in Supabase SQL Editor or via migration.
CREATE TABLE IF NOT EXISTS notebook_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFAULT (auth.jwt()->>'sub'),
    title TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_notebook_notes
BEFORE UPDATE ON notebook_notes
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

ALTER TABLE notebook_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notebook_notes" ON notebook_notes
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);
