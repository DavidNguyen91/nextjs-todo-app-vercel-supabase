import React from 'react';
import { TaskFilter } from '@/types/task';
import { EmptyInboxIcon, SparklesIcon, CheckIcon } from './Icons';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  filter: TaskFilter;
  hasAnyTasks: boolean;
}

export function EmptyState({ filter, hasAnyTasks }: EmptyStateProps) {
  if (!hasAnyTasks) {
    return (
      <div className={styles.container}>
        <div className={styles.iconWrapper}>
          <EmptyInboxIcon size={32} />
        </div>
        <h3 className={styles.title}>No Tasks Yet</h3>
        <p className={styles.description}>
          Type a task in the field above to organize your goals and daily to-dos.
        </p>
      </div>
    );
  }

  if (filter === 'active') {
    return (
      <div className={styles.container}>
        <div className={`${styles.iconWrapper} ${styles.iconCompleted}`}>
          <SparklesIcon size={30} />
        </div>
        <h3 className={styles.title}>All Caught Up</h3>
        <p className={styles.description}>
          You have finished all active tasks. Take a break or add a new one.
        </p>
      </div>
    );
  }

  if (filter === 'completed') {
    return (
      <div className={styles.container}>
        <div className={styles.iconWrapper}>
          <CheckIcon size={28} />
        </div>
        <h3 className={styles.title}>No Completed Tasks</h3>
        <p className={styles.description}>
          Tasks you check off will appear here for easy reference.
        </p>
      </div>
    );
  }

  return null;
}
