'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: Error | null}>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

function getInitialTestUser(): User | null {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/e2e_test_session=([^;]+)/);
    if (match) {
      try {
        return JSON.parse(decodeURIComponent(match[1]));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function useAuth(): AuthState {
  const isConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(getInitialTestUser);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If we already have a test session in cookie, no async work needed
    if (getInitialTestUser()) return false;
    return isConfigured;
  });

  // Track whether this is the synthetic test user to avoid Supabase calls
  const isSyntheticTestUser = user?.id === '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    // Do not touch Supabase for synthetic test users
    if (isSyntheticTestUser) {
      return;
    }

    if (!isConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;

    // Bootstrap: read current session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    // Listen for auth state changes (sign-in, sign-out, token refresh).
    // NOTE: `user` is intentionally NOT in the dependency array.
    // Putting `user` here causes an infinite loop: onAuthStateChange fires
    // → setUser → user changes → effect re-runs → new subscription fires → repeat.
  const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
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
    // Intentionally only re-run when configuration changes, NOT when `user` changes.
  }, [isConfigured, isSyntheticTestUser]);

  // 🟢 Thêm hàm đăng ký tài khoản mới bằng Email & Password
  const signUpWithPassword = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        return { error: new Error('Supabase is not configured yet.') };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return { error: error ? new Error(error.message) : null };
    },
    []
  );

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

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        return { error: new Error('Supabase is not configured yet.') };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Do NOT manually call setUser/setSession here.
      // `onAuthStateChange` will fire automatically and update state once.
      // Calling setUser here AND via onAuthStateChange creates a double-update
      // that triggers the useEffect dependency loop.

      return { error: error ? new Error(error.message) : null };
    },
    []
  );

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
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'e2e_test_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    // setUser/setSession will be updated via onAuthStateChange automatically.
    // For synthetic test users (no Supabase), clear manually.
    if (isSyntheticTestUser) {
      setUser(null);
      setSession(null);
    }
  }, [isSyntheticTestUser]);

  return {
    user,
    session,
    isLoading,
    isConfigured,
    signUpWithPassword,
    signInWithGoogle,
    signInWithPassword,
    signInWithOtp,
    signOut,
  };
}
