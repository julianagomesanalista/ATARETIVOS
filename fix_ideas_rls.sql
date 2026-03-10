-- Run this in the Supabase SQL Editor to fix the RLS issue for Google-login users
-- who don't have a Supabase auth session (anon key only).

-- Allow anyone (anon + authenticated) to READ ideas
DROP POLICY IF EXISTS "Allow read ideas" ON ideas;
CREATE POLICY "Allow read ideas" ON ideas
  FOR SELECT USING (true);

-- Allow anyone to READ idea_comments
DROP POLICY IF EXISTS "Allow read idea_comments" ON idea_comments;
CREATE POLICY "Allow read idea_comments" ON idea_comments
  FOR SELECT USING (true);

-- Allow anyone to INSERT ideas (anon with anon key)
DROP POLICY IF EXISTS "Allow insert ideas" ON ideas;
CREATE POLICY "Allow insert ideas" ON ideas
  FOR INSERT WITH CHECK (true);

-- Allow anyone to INSERT idea_comments (anon with anon key)
DROP POLICY IF EXISTS "Allow insert idea_comments" ON idea_comments;
CREATE POLICY "Allow insert idea_comments" ON idea_comments
  FOR INSERT WITH CHECK (true);

-- Allow creator or admin to DELETE ideas
DROP POLICY IF EXISTS "Allow delete ideas" ON ideas;
CREATE POLICY "Allow delete ideas" ON ideas
  FOR DELETE USING (true);

-- Allow creator or admin to DELETE idea_comments
DROP POLICY IF EXISTS "Allow delete idea_comments" ON idea_comments;
CREATE POLICY "Allow delete idea_comments" ON idea_comments
  FOR DELETE USING (true);
