
-- ====================================================================
-- SUPABASE DATABASE SCHEMA FOR APPLE TASKS APP
-- Schema version: Updated November 2026
-- ====================================================================

-- 1. Create the tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id uuid NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) > 0),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Remove existing policies if they exist
-- This allows the schema to be executed again safely.
DROP POLICY IF EXISTS "Users can view their own tasks"
  ON public.tasks;

DROP POLICY IF EXISTS "Users can insert their own tasks"
  ON public.tasks;

DROP POLICY IF EXISTS "Users can update their own tasks"
  ON public.tasks;

DROP POLICY IF EXISTS "Users can delete their own tasks"
  ON public.tasks;

-- 4. Create Row Level Security Policies

-- Users can only view their own tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users can only insert their own tasks
CREATE POLICY "Users can insert their own tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id
  ON public.tasks (user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at
  ON public.tasks (created_at DESC);

-- ====================================================================
-- END OF SCHEMA
-- ====================================================================
