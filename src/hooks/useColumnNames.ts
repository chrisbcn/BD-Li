import { useState, useEffect } from 'react';
import { TaskStatus, TASK_STATUS } from '../constants/taskStatus';
import {
  fetchColumnNames,
  saveColumnNames as saveColumnNamesService,
} from '../services/columnNamesService';

const DEFAULT_COLUMN_NAMES: Record<TaskStatus, string> = {
  [TASK_STATUS.INCOMING]: 'Incoming',
  [TASK_STATUS.AI_CAPTURED]: 'AI Captured',
  [TASK_STATUS.TODO]: 'To-do',
  [TASK_STATUS.DONE]: 'Done',
};

export function useColumnNames() {
  const [columnNames, setColumnNames] = useState<Record<TaskStatus, string>>(
    DEFAULT_COLUMN_NAMES
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch column names from database on mount
  useEffect(() => {
    async function loadColumnNames() {
      try {
        const names = await fetchColumnNames();
        setColumnNames(names);
      } catch (error) {
        console.error('Error fetching column names:', error);
        // Use defaults on error
      } finally {
        setIsInitialized(true);
      }
    }

    loadColumnNames();
  }, []);

  // Save column names to database whenever they change (but not on initial load)
  useEffect(() => {
    if (!isInitialized) return;

    async function saveColumnNames() {
      try {
        await saveColumnNamesService(columnNames);
      } catch (error) {
        console.error('Error saving column names:', error);
        // Non-critical, don't show error to user
      }
    }

    saveColumnNames();
  }, [columnNames, isInitialized]);

  const updateColumnName = (status: TaskStatus, name: string) => {
    setColumnNames((prev) => ({
      ...prev,
      [status]: name,
    }));
  };

  return {
    columnNames,
    updateColumnName,
  };
}
