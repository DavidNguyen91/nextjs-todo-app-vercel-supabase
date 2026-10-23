'use client';

import React, { useSyncExternalStore } from 'react';
import { AuthButton } from './AuthButton';
import styles from './Header.module.css';

interface HeaderProps {
  activeCount: number;
  totalCount: number;
}

function subscribe() {
  return () => {};
}

function getClientDate() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

function getServerDate() {
  return 'Today';
}

export function Header({ activeCount, totalCount }: HeaderProps) {
  const formattedDate = useSyncExternalStore(subscribe, getClientDate, getServerDate);
  const isAllDone = totalCount > 0 && activeCount === 0;

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <span className={styles.date} aria-label={`Current date: ${formattedDate}`}>
          {formattedDate}
        </span>
        <div className={styles.topRight}>
          {totalCount > 0 && (
            <span
              className={`${styles.statusBadge} ${isAllDone ? styles.statusBadgeAllDone : ''}`}
              aria-live="polite"
            >
              {isAllDone ? 'All tasks completed' : `${activeCount} remaining`}
            </span>
          )}
          <AuthButton />
        </div>
      </div>
      <div className={styles.titleWrapper}>
        <h1 className={styles.title}>My Tasks</h1>
      </div>
      <p className={styles.subtitle}>Keep track of what matters today.</p>
    </header>
  );
}
