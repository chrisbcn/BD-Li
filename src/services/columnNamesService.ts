/**
 * Column Names Service
 * Handles column name storage and retrieval
 */

import { supabase } from '../lib/supabase';
import { TaskStatus, TASK_STATUS } from '../constants/taskStatus';

const DEFAULT_COLUMN_NAMES: Record<TaskStatus, string> = {
  [TASK_STATUS.INCOMING]: 'Incoming',
  [TASK_STATUS.TODO]: 'To-do',
  [TASK_STATUS.DONE]: 'Done',
};

export async function fetchColumnNames(): Promise<Record<TaskStatus, string>> {
  try {
    // Get the first row (we'll support multi-user later)
    const { data, error } = await supabase
      .from('column_names')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      throw new Error(error.message);
    }

    if (data) {
      return {
        [TASK_STATUS.INCOMING]: data.incoming || DEFAULT_COLUMN_NAMES[TASK_STATUS.INCOMING],
        [TASK_STATUS.TODO]: data.todo || DEFAULT_COLUMN_NAMES[TASK_STATUS.TODO],
        [TASK_STATUS.DONE]: data.done || DEFAULT_COLUMN_NAMES[TASK_STATUS.DONE],
      };
    }

    return DEFAULT_COLUMN_NAMES;
  } catch (error) {
    console.error('Error fetching column names:', error);
    return DEFAULT_COLUMN_NAMES;
  }
}

export async function saveColumnNames(
  columnNames: Record<TaskStatus, string>
): Promise<void> {
  try {
    // Upsert the first row (we'll support multi-user later)
    const { error } = await supabase
      .from('column_names')
      .upsert(
        {
          user_id: null, // For now, single user
          incoming: columnNames[TASK_STATUS.INCOMING],
          todo: columnNames[TASK_STATUS.TODO],
          done: columnNames[TASK_STATUS.DONE],
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error saving column names:', error);
    // Don't throw - column names are not critical
  }
}

