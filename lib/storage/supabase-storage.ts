import { ITaskRepository, Task, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export class SupabaseTaskRepository implements ITaskRepository {
  private getClient() {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new Error('Supabase client is not configured. Please check your environment variables.');
    }
    return client;
  }

  async getTasks(): Promise<Task[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, completed, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getTasks error:', error);
      throw error;
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      completed: Boolean(row.completed),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }));
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    // In database storage, writes occur per item. If bulk save is requested, upsert records.
    if (tasks.length === 0) return;
    const supabase = this.getClient();
    const payload = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    }));

    const { error } = await supabase.from('tasks').upsert(payload);
    if (error) {
      console.error('Supabase saveTasks error:', error);
      throw error;
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

    const supabase = this.getClient();
    const { error } = await supabase.from('tasks').insert({
      id: newTask.id,
      title: newTask.title,
      completed: newTask.completed,
      created_at: newTask.createdAt,
      updated_at: newTask.updatedAt,
    });

    if (error) {
      console.error('Supabase createTask error:', error);
      throw error;
    }

    return newTask;
  }

  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
    const supabase = this.getClient();
    const payload: Record<string, unknown> = {
      updated_at: Date.now(),
    };

    if (updates.title !== undefined) {
      const trimmed = updates.title.trim();
      if (!trimmed) throw new Error('Task title cannot be empty');
      payload.title = trimmed;
    }

    if (updates.completed !== undefined) {
      payload.completed = updates.completed;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select('id, title, completed, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase updateTask error:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      completed: Boolean(data.completed),
      createdAt: Number(data.created_at),
      updatedAt: Number(data.updated_at),
    };
  }

  async deleteTask(id: string): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteTask error:', error);
      throw error;
    }
  }

  async clearCompletedTasks(): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.from('tasks').delete().eq('completed', true);
    if (error) {
      console.error('Supabase clearCompletedTasks error:', error);
      throw error;
    }
  }
}

export const supabaseTaskRepository = new SupabaseTaskRepository();
