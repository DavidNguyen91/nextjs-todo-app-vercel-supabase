'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { Task, TaskFilter } from '@/types/task';
import { getActiveRepository } from '@/lib/storage';

export function useTasks(user: User | null = null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const repository = useMemo(() => getActiveRepository(user), [user]);

  // Re-fetch tasks whenever the active storage repository or user session changes
  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      try {
        const loaded = await repository.getTasks();
        if (isMounted) {
          setTasks(loaded);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load tasks', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTasks();
    return () => {
      isMounted = false;
    };
  }, [repository]);

  const addTask = useCallback(
    async (title: string): Promise<boolean> => {
      const trimmed = title.trim();
      if (!trimmed) return false;

      try {
        const created = await repository.createTask({ title: trimmed });
        setTasks((prev) => [created, ...prev]);
        return true;
      } catch (err) {
        console.error('Failed to create task', err);
        return false;
      }
    },
    [repository]
  );

  const toggleTask = useCallback(
    async (id: string): Promise<void> => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t))
      );

      try {
        const current = tasks.find((t) => t.id === id);
        if (current) {
          await repository.updateTask(id, { completed: !current.completed });
        }
      } catch (err) {
        console.error('Failed to toggle task', err);
        // Revert on error
        const loaded = await repository.getTasks();
        setTasks(loaded);
      }
    },
    [tasks, repository]
  );

  const editTask = useCallback(
    async (id: string, newTitle: string): Promise<boolean> => {
      const trimmed = newTitle.trim();
      if (!trimmed) return false;

      const previous = tasks;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: trimmed, updatedAt: Date.now() } : t))
      );

      try {
        await repository.updateTask(id, { title: trimmed });
        return true;
      } catch (err) {
        console.error('Failed to update task', err);
        setTasks(previous);
        return false;
      }
    },
    [tasks, repository]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await repository.deleteTask(id);
      } catch (err) {
        console.error('Failed to delete task', err);
        const loaded = await repository.getTasks();
        setTasks(loaded);
      }
    },
    [repository]
  );

  const clearCompleted = useCallback(async (): Promise<void> => {
    setTasks((prev) => prev.filter((t) => !t.completed));
    try {
      await repository.clearCompletedTasks();
    } catch (err) {
      console.error('Failed to clear completed tasks', err);
      const loaded = await repository.getTasks();
      setTasks(loaded);
    }
  }, [repository]);

  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      case 'all':
      default:
        return tasks;
    }
  }, [tasks, filter]);

  return {
    tasks,
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
    isCloudSynced: Boolean(user),
  };
}
