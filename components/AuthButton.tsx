'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { CloudIcon } from './Icons';
import styles from './AuthButton.module.css';

export function AuthButton() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    // Navigate to /login. router.refresh() after signOut caused additional
    // RSC fetches while the session was being cleared — removed intentionally.
    router.push('/login');
  };

  const initials = (user.email?.[0] || 'U').toUpperCase();

  return (
    <div className={styles.authContainer}>
      <div className={styles.userPill} data-testid="user-pill">
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <span className={styles.userEmail} title={user.email ?? ''} data-testid="user-email">
          {user.email}
        </span>
        <span className={styles.cloudSyncBadge} title="Tasks synced to Supabase Cloud">
          <CloudIcon size={14} />
        </span>
        <button
          type="button"
          className={styles.signOutLink}
          onClick={handleSignOut}
          aria-label="Sign out of account"
          data-testid="sign-out-btn"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
