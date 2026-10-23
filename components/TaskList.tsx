'use client';

import React from 'react';
import { Task, TaskFilter } from '@/types/task';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  hasAnyTasks: boolean;
  filter: TaskFilter;
  activeCount: number;
  onToggle: (id: string) => void;
  onEdit: (id: string, newTitle: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}

export function TaskList({
  tasks,
  hasAnyTasks,
  filter,
  activeCount,
  onToggle,
  onEdit,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState filter={filter} hasAnyTasks={hasAnyTasks} />;
  }

  return (
    <section className={styles.card} aria-label="Task list container">
      <ul className={styles.list} id="task-list" role="list">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
      <div className={styles.footer}>
        <span className={styles.counter}>
          {activeCount === 1 ? '1 item remaining' : `${activeCount} items remaining`}
        </span>
        <span className={styles.hint}>Double-click any task to edit inline</span>
      </div>
    </section>
  );
}
