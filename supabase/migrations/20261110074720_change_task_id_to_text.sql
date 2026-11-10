
-- Change tasks.id from UUID to TEXT.
-- Preserve existing task IDs and use UUID strings for new IDs.

ALTER TABLE public.tasks
  ALTER COLUMN id DROP DEFAULT;

ALTER TABLE public.tasks
  ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE public.tasks
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
