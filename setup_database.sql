-- ==========================================
-- Supabase Schema Setup for Ataretivos
-- ==========================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'master', 'user')),
  google_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  complexity TEXT DEFAULT 'facil' CHECK (complexity IN ('facil', 'medio', 'dificil')),
  company_name TEXT,
  due_date TIMESTAMPTZ,
  tags JSONB DEFAULT '[]'::jsonb, -- Store tags as JSON array
  creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL means global chat
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Enable Row Level Security (RLS)
-- For now, allowing all authenticated users 
-- to read and write for rapid development.
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create generic policies (You can restrict these later)
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on email" ON public.users FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- Initial Super Admin (Optional)
-- This ensures you are an admin on first login.
-- It will be inserted automatically when you login, 
-- but doing it here guarantees the role.
-- ==========================================
-- (Skipped automatic insert to let the app handle it on first OAuth login)
