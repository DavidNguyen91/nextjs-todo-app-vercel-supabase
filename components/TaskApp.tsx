'use client';

import React from 'react';
import { useAuth } from '@/lib/useAuth';
import { useTasks } from '@/lib/useTasks';
import { Header } from './Header';
import { TaskInput } from './TaskInput';
import { TaskFilters } from './TaskFilters';
import { TaskList } from './TaskList';
import styles from './TaskApp.module.css';

export function TaskApp() {
  const { user } = useAuth();
  const {
    filteredTasks,
    filter,
    setFilter,
    isLoading,
    addTask,
    toggleTask,
    editTask,
    deleteTask,
    clearCompleted,
    counts,
  } = useTasks(user);

  return (
    <div className={styles.wrapper}>
      <Header activeCount={counts.active} totalCount={counts.total} />

      <TaskInput onAddTask={addTask} />

      {isLoading ? (
        <div className={styles.loadingPlaceholder} aria-busy="true" aria-label="Loading tasks">
          <div className={styles.skeletonLine} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          <div className={styles.skeletonLine} />
        </div>
      ) : (
        <>
          {counts.total > 0 && (
            <TaskFilters
              currentFilter={filter}
              onFilterChange={setFilter}
              counts={counts}
              onClearCompleted={clearCompleted}
            />
          )}

          <TaskList
            tasks={filteredTasks}
            hasAnyTasks={counts.total > 0}
            filter={filter}
            activeCount={counts.active}
            onToggle={toggleTask}
            onEdit={editTask}
            onDelete={deleteTask}
          />
        </>
      )}
    </div>
  );
}
