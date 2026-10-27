'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { Task, TaskFilter } from '@/types/task';
import { getActiveRepository } from '@/lib/storage';

export function useTasks(user: User | null = null) {
  // 1️⃣ Nếu không có user, khởi tạo luôn mảng rỗng và không loading
  const [tasks, setTasks] = useState<Task[]>(() => (user ? [] : []));
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(user));

  const repository = useMemo(() => getActiveRepository(user), [user]);

  // Re-fetch tasks whenever the active storage repository or user session changes
 useEffect(() => {
    let isMounted = true;

    async function syncTasks() {
      if (!user) {
        if (isMounted) {
          setTasks([]);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) setIsLoading(true);
      try {
        const loaded = await repository.getTasks();
        if (isMounted) {
          setTasks(loaded);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load tasks', err);
        if (isMounted) setIsLoading(false);
      }
    }

    syncTasks();

    return () => {
      isMounted = false;
    };
  }, [user, repository]);
  
  const addTask = useCallback(
    async (title: string): Promise<boolean> => {
      const trimmed = title.trim();
      if (!trimmed || !user) return false;

      try {
        const created = await repository.createTask({ title: trimmed });
        setTasks((prev) => [created, ...prev]);
        return true;
      } catch (err) {
        console.error('Failed to create task', err);
        return false;
      }
    },
    [user, repository]
  );

  const toggleTask = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;

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
    [user, tasks, repository]
  );

  const editTask = useCallback(
    async (id: string, newTitle: string): Promise<boolean> => {
      const trimmed = newTitle.trim();
      if (!trimmed || !user) return false;

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
    [user, tasks, repository]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await repository.deleteTask(id);
      } catch (err) {
        console.error('Failed to delete task', err);
        const loaded = await repository.getTasks();
        setTasks(loaded);
      }
    },
    [user, repository]
  );

  const clearCompleted = useCallback(async (): Promise<void> => {
    if (!user) return;

    setTasks((prev) => prev.filter((t) => !t.completed));
    try {
      await repository.clearCompletedTasks();
    } catch (err) {
      console.error('Failed to clear completed tasks', err);
      const loaded = await repository.getTasks();
      setTasks(loaded);
    }
  }, [user, repository]);

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