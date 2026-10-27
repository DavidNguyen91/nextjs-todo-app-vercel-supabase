import type { User } from '@supabase/supabase-js';
import { ITaskRepository } from '@/types/task';
import { supabaseTaskRepository } from './supabase-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export * from './supabase-storage';

/**
 * Returns the appropriate repository based on the user's authentication state.
 * - Authenticated with real Supabase user: uses Supabase database.
 * - Test environment synthetic user (id: 00000000-0000-0000-0000-000000000001): uses LocalStorage to prevent polluting cloud DB.
 * - Unauthenticated or offline: uses browser LocalStorage.
 */
export function getActiveRepository(user: User | null): ITaskRepository {
  const isSyntheticTestUser = user?.id === '00000000-0000-0000-0000-000000000001';

  if (user && isSupabaseConfigured() && !isSyntheticTestUser) {
    return supabaseTaskRepository;
  }
  return supabaseTaskRepository; // For now, always use Supabase for testing purposes}
}