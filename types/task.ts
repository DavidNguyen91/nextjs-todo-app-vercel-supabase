export type TaskFilter = 'all' | 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export type CreateTaskInput = {
  title: string;
};

export type UpdateTaskInput = {
  title?: string;
  completed?: boolean;
};

/**
 * Storage interface contract.
 * Allows switching between LocalStorage, Supabase, or any backend
 * without altering the UI or task management hook.
 */
export interface ITaskRepository {
  getTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, updates: UpdateTaskInput): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  clearCompletedTasks(): Promise<void>;
}
