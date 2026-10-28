'use client';

import React from 'react';
import { TaskFilter } from '@/types/task';
import styles from './TaskFilters.module.css';

interface TaskFiltersProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  counts: {
    total: number;
    active: number;
    completed: number;
  };
  onClearCompleted: () => void;
}

export function TaskFilters({
  currentFilter,
  onFilterChange,
  counts,
  onClearCompleted,
}: TaskFiltersProps) {
  const filters: { key: TaskFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.total },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className={styles.container}>
      <div
        className={styles.segmentedControl}
        role="tablist"
        aria-label="Filter tasks by status"
      >
        {filters.map(({ key, label, count }) => {
          const isActive = currentFilter === key;
          return (
            <button
              key={key}
              data-testid={`filter-${key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls="task-list"
              className={`${styles.segment} ${isActive ? styles.segmentActive : ''}`}
              onClick={() => onFilterChange(key)}
            >
              <span>{label}</span>
              <span
                data-testid={`count-${key}`}
                className={styles.countBadge}
                aria-label={`${count} ${label.toLowerCase()} tasks`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {counts.completed > 0 && (
        <button
          type="button"
          data-testid="clear-completed-btn"
          className={styles.clearButton}
          onClick={onClearCompleted}
          aria-label={`Clear all ${counts.completed} completed tasks`}
        >
          Clear completed
        </button>
      )}
    </div>
  );
}