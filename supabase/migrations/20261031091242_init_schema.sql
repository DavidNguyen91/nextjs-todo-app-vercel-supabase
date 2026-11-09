-- 1. Create the tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) > 0),
  completed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.tasks enable row level security;

-- 3. Row Level Security Policies
create policy "Users can view their own tasks"
  on public.tasks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4. Create performance indexes
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_created_at on public.tasks (created_at desc);