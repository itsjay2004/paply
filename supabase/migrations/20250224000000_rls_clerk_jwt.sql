-- Use Clerk JWT 'sub' claim for RLS when using Clerk as third-party auth.
-- Run this migration if your app uses Clerk with Supabase (auth.uid() is not set from Clerk tokens).
-- Drop existing policies and recreate using auth.jwt()->>'sub'.
-- Also set user_id column defaults so INSERTs get the Clerk ID from the JWT.

ALTER TABLE collections ALTER COLUMN user_id SET DEFAULT (auth.jwt()->>'sub');
ALTER TABLE papers ALTER COLUMN user_id SET DEFAULT (auth.jwt()->>'sub');
ALTER TABLE highlights ALTER COLUMN user_id SET DEFAULT (auth.jwt()->>'sub');
ALTER TABLE notes ALTER COLUMN user_id SET DEFAULT (auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Users can manage their own data" ON users;
CREATE POLICY "Users can manage their own data" ON users
FOR ALL USING ((auth.jwt()->>'sub') = id)
WITH CHECK ((auth.jwt()->>'sub') = id);

DROP POLICY IF EXISTS "Users can manage their own collections" ON collections;
CREATE POLICY "Users can manage their own collections" ON collections
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

DROP POLICY IF EXISTS "Users can manage their own papers" ON papers;
CREATE POLICY "Users can manage their own papers" ON papers
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

DROP POLICY IF EXISTS "Users can manage their own highlights" ON highlights;
CREATE POLICY "Users can manage their own highlights" ON highlights
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);

DROP POLICY IF EXISTS "Users can manage their own notes" ON notes;
CREATE POLICY "Users can manage their own notes" ON notes
FOR ALL USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);
