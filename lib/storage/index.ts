import type { User } from '@supabase/supabase-js';
import { ITaskRepository } from '@/types/task';
import { taskRepository as localRepo } from './task-storage';
import { supabaseTaskRepository } from './supabase-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export * from './task-storage';
export * from './supabase-storage';

/**
 * Returns the appropriate repository based on the user's authentication state.
 * - Authenticated with Supabase: uses Supabase database.
 * - Unauthenticated or offline: uses browser LocalStorage.
 */
export function getActiveRepository(user: User | null): ITaskRepository {
  if (user && isSupabaseConfigured()) {
    return supabaseTaskRepository;
  }
  return localRepo;
}
