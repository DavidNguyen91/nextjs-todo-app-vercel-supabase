-- ====================================================================
-- SUPABASE DATABASE SCHEMA FOR APPLE TASKS APP
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Create the tasks table
create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) > 0),
  completed boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.tasks enable row level security;

-- 3. Row Level Security Policies (Per-user data isolation)
-- Policy: Users can only view their own tasks
create policy "Users can view their own tasks"
  on public.tasks
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert tasks for themselves
create policy "Users can insert their own tasks"
  on public.tasks
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only update their own tasks
create policy "Users can update their own tasks"
  on public.tasks
  for update
  using (auth.uid() = user_id);

-- Policy: Users can only delete their own tasks
create policy "Users can delete their own tasks"
  on public.tasks
  for delete
  using (auth.uid() = user_id);

-- 4. Create performance indexes for fast filtering and ordering
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_created_at on public.tasks (created_at desc);
