'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const isConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // If not configured, there is no async auth session to fetch
  const [isLoading, setIsLoading] = useState<boolean>(() => isConfigured);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    // Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signInWithGoogle = useCallback(async (): Promise<{ error: Error | null }> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: new Error('Supabase is not configured yet.') };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInWithOtp = useCallback(async (email: string): Promise<{ error: Error | null }> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: new Error('Supabase is not configured yet.') };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    session,
    isLoading,
    isConfigured,
    signInWithGoogle,
    signInWithOtp,
    signOut,
  };
}
