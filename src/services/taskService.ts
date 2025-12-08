/**
 * Task Service
 * Handles all database operations for tasks using Supabase
 * Clean separation of business logic from data access
 */

import { Task, CreateTaskInput } from '../types/Task';
import { supabase } from '../lib/supabase';
import { DEFAULT_RECURRENCE_DAYS } from '../constants/taskStatus';

/**
 * Parse dates from database response
 * Converts ISO date strings to Date objects
 */
function parseTaskDates(task: any): Task {
  const parseDate = (date: string | Date | null | undefined): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    return new Date(date);
  };

  return {
    ...task,
    created_at: parseDate(task.created_at) || new Date(),
    updated_at: parseDate(task.updated_at) || new Date(),
    due_date: parseDate(task.due_date),
    completed_date: parseDate(task.completed_date),
    // JSONB fields are already parsed by Supabase
    contact: task.contact || undefined,
    account_info: task.account_info || undefined,
    source_reference: task.source_reference || undefined,
    recent_activity: task.recent_activity || undefined,
  } as Task;
}

/**
 * Fetch all tasks from the database
 */
export async function fetchTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(parseTaskDates);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to load tasks. Please try again later.'
    );
  }
}

/**
 * Save a single task to the database (insert or update)
 */
export async function saveTask(task: Task): Promise<Task> {
  try {
    // Convert Date objects to ISO strings for database
    const taskData = {
      ...task,
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString(),
      due_date: task.due_date?.toISOString() || null,
      completed_date: task.completed_date?.toISOString() || null,
      // JSONB fields are automatically handled by Supabase
    };

    const { data, error } = await supabase
      .from('tasks')
      .upsert(taskData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return parseTaskDates(data);
  } catch (error) {
    console.error('Error saving task:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to save task. Please try again later.'
    );
  }
}

/**
 * Save multiple tasks to the database
 * Uses upsert to handle both inserts and updates
 */
export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    // Convert Date objects to ISO strings for database
    const tasksData = tasks.map((task) => ({
      ...task,
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString(),
      due_date: task.due_date?.toISOString() || null,
      completed_date: task.completed_date?.toISOString() || null,
      // JSONB fields are automatically handled by Supabase
    }));

    const { error } = await supabase.from('tasks').upsert(tasksData, {
      onConflict: 'id',
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to save tasks. Please try again later.'
    );
  }
}

/**
 * Delete a task from the database
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to delete task. Please try again later.'
    );
  }
}

/**
 * Create a new task with default values
 */
export function createTask(
  title: string,
  description: string = '',
  status: Task['status'] = 'incoming'
): CreateTaskInput {
  const now = new Date();
  return {
    title: title.trim(),
    description: description.trim(),
    status,
    created_at: now,
    updated_at: now,
    source: 'manual',
    recurrence_enabled: true,
    recurrence_days: DEFAULT_RECURRENCE_DAYS,
  };
}

/**
 * Check and process recurring tasks
 * Moves tasks from 'done' back to 'incoming' after recurrence period
 */
export function processRecurringTasks(tasks: Task[]): Task[] {
  const now = new Date();

  return tasks.map((task) => {
    // Only process tasks that are done, have recurrence enabled, and a completion date
    if (
      task.status === 'done' &&
      task.recurrence_enabled &&
      task.completed_date
    ) {
      const recurrenceDays = task.recurrence_days || DEFAULT_RECURRENCE_DAYS;
      const daysSinceCompletion =
        (now.getTime() - task.completed_date.getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysSinceCompletion >= recurrenceDays) {
        return {
          ...task,
          status: 'incoming',
          completed_date: null,
          updated_at: now,
        };
      }
    }
    return task;
  });
}
