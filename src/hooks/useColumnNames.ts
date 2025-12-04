import { useState, useEffect } from 'react';
import { TaskStatus } from '../types/Task';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const DEFAULT_COLUMN_NAMES: Record<TaskStatus, string> = {
  incoming: 'Incoming',
  ai_captured: 'AI Captured',
  todo: 'To-do',
  done: 'Done',
};

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4aa4529b`;

export function useColumnNames() {
  const [columnNames, setColumnNames] = useState<Record<TaskStatus, string>>(DEFAULT_COLUMN_NAMES);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch column names from backend on mount
  useEffect(() => {
    async function fetchColumnNames() {
      try {
        const response = await fetch(`${API_BASE}/column-names`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch column names: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.columnNames) {
          setColumnNames(data.columnNames);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching column names:', error);
        setIsInitialized(true);
      }
    }

    fetchColumnNames();
  }, []);

  // Save column names to backend whenever they change (but not on initial load)
  useEffect(() => {
    if (!isInitialized) return;

    async function saveColumnNames() {
      try {
        const response = await fetch(`${API_BASE}/column-names`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ columnNames }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save column names: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error saving column names:', error);
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
