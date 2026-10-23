import { Task, CreateTaskInput, UpdateTaskInput, ITaskRepository } from '@/types/task';

const STORAGE_KEY = 'apple_tasks_app_items_v1';

const DEFAULT_SAMPLE_TASKS: Task[] = [
  {
    id: 'sample-1',
    title: 'Explore Apple Human Interface Guidelines for typography and spacing',
    completed: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'sample-2',
    title: 'Design a clean, distraction-free task management experience',
    completed: false,
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
  },
  {
    id: 'sample-3',
    title: 'Prepare Supabase database and authentication adapter',
    completed: false,
    createdAt: Date.now() - 10000000,
    updatedAt: Date.now() - 10000000,
  },
];

export class LocalStorageTaskRepository implements ITaskRepository {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  async getTasks(): Promise<Task[]> {
    if (!this.isBrowser()) {
      return [];
    }

    try {
      const rawData = window.localStorage.getItem(STORAGE_KEY);
      if (!rawData) {
        // First visit: initialize with sample tasks and persist
        await this.saveTasks(DEFAULT_SAMPLE_TASKS);
        return DEFAULT_SAMPLE_TASKS;
      }

      const parsed = JSON.parse(rawData);
      if (!Array.isArray(parsed)) {
        console.warn('Malformed tasks found in localStorage. Resetting to defaults.');
        await this.saveTasks(DEFAULT_SAMPLE_TASKS);
        return DEFAULT_SAMPLE_TASKS;
      }

      // Validate each item shape
      const validated: Task[] = parsed
        .filter((item: unknown): item is Partial<Task> => typeof item === 'object' && item !== null)
        .map((item) => ({
          id: typeof item.id === 'string' ? item.id : `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: typeof item.title === 'string' ? item.title.trim() : 'Untitled task',
          completed: Boolean(item.completed),
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
          updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
        }))
        .filter((task) => task.title.length > 0);

      return validated;
    } catch (error) {
      console.error('Failed to read tasks from localStorage:', error);
      return DEFAULT_SAMPLE_TASKS;
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    if (!this.isBrowser()) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to write tasks to localStorage:', error);
    }
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) {
      throw new Error('Task title cannot be empty');
    }

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: trimmedTitle,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const currentTasks = await this.getTasks();
    const updated = [newTask, ...currentTasks];
    await this.saveTasks(updated);

    return newTask;
  }

  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
    const currentTasks = await this.getTasks();
    const taskIndex = currentTasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const target = currentTasks[taskIndex];
    const updatedTask: Task = {
      ...target,
      ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
      ...(updates.completed !== undefined ? { completed: updates.completed } : {}),
      updatedAt: Date.now(),
    };

    if (!updatedTask.title) {
      throw new Error('Task title cannot be empty');
    }

    currentTasks[taskIndex] = updatedTask;
    await this.saveTasks(currentTasks);

    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const currentTasks = await this.getTasks();
    const filtered = currentTasks.filter((t) => t.id !== id);
    await this.saveTasks(filtered);
  }

  async clearCompletedTasks(): Promise<void> {
    const currentTasks = await this.getTasks();
    const remaining = currentTasks.filter((t) => !t.completed);
    await this.saveTasks(remaining);
  }
}

export const taskRepository = new LocalStorageTaskRepository();
