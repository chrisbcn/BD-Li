/**
 * useTasks Hook
 * Manages task state and provides task operations
 * Clean separation of concerns - uses taskService for API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types/Task';
import { TaskStatus } from '../constants/taskStatus';
import {
  fetchTasks,
  saveTasks,
  saveTask,
  deleteTask as deleteTaskService,
  createTask,
  processRecurringTasks,
} from '../services/taskService';

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  addTask: (title: string, description: string, status?: TaskStatus) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load tasks on mount
  useEffect(() => {
    async function loadTasks() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedTasks = await fetchTasks();
        const processedTasks = processRecurringTasks(fetchedTasks);
        setTasks(processedTasks);
        setIsInitialized(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load tasks';
        setError(errorMessage);
        console.error('Error loading tasks:', err);
        // Start with empty array instead of demo data
        setTasks([]);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadTasks();
  }, []);

  // Check for recurring tasks periodically (every minute)
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      setTasks((prevTasks) => {
        const updatedTasks = processRecurringTasks(prevTasks);
        // Only update if something changed
        const hasChanges =
          JSON.stringify(updatedTasks) !== JSON.stringify(prevTasks);
        return hasChanges ? updatedTasks : prevTasks;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isInitialized]);

  // Save tasks to backend whenever they change (debounced)
  // Only save if we have tasks and they've been initialized
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(async () => {
      try {
        if (tasks.length > 0) {
          await saveTasks(tasks);
        }
      } catch (err) {
        console.error('Error saving tasks:', err);
        // Don't set error state here - user can continue working
        // Could implement retry logic or show a toast notification
      }
    }, 1000); // Debounce saves by 1 second to avoid too many requests

    return () => clearTimeout(timeoutId);
  }, [tasks, isInitialized]);

  const addTask = useCallback(
    async (
      title: string,
      description: string = '',
      status: TaskStatus = 'incoming'
    ): Promise<Task> => {
      const newTaskInput = createTask(title, description, status);
      const newTask: Task = {
        ...newTaskInput,
        id: crypto.randomUUID(),
      };
      
      // Immediately save to database
      try {
        const savedTask = await saveTask(newTask);
        setTasks((prev) => [...prev, savedTask]);
        return savedTask;
      } catch (err) {
        console.error('Error saving new task:', err);
        // Still add to local state for optimistic UI
        setTasks((prev) => [...prev, newTask]);
        return newTask;
      }
    },
    []
  );

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // Get current task before updating
    let previousTask: Task | undefined;
    setTasks((prev) => {
      previousTask = prev.find(t => t.id === id);
      return prev.map((task) =>
        task.id === id
          ? { ...task, ...updates, updated_at: new Date() }
          : task
      );
    });
    
    // Immediately save to database
    if (previousTask) {
      try {
        const taskToSave = { ...previousTask, ...updates, updated_at: new Date() };
        await saveTask(taskToSave);
      } catch (err) {
        console.error('Error saving task update:', err);
        // Revert optimistic update on error
        if (previousTask) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === id ? previousTask! : task
            )
          );
        }
      }
    }
  }, []);

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await deleteTaskService(id);
        setTasks((prev) => prev.filter((task) => task.id !== id));
      } catch (err) {
        console.error('Error deleting task:', err);
        // Still remove from local state for optimistic UI
        setTasks((prev) => prev.filter((task) => task.id !== id));
      }
    },
    []
  );

  const moveTask = useCallback((id: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        const updates: Partial<Task> = { status: newStatus };

        // Record completion date when moving to done
        if (newStatus === 'done') {
          updates.completed_date = new Date();
        }
        // Clear completion date when moving away from done
        else if (task.status === 'done' && newStatus !== 'done') {
          updates.completed_date = null;
        }

        return {
          ...task,
          ...updates,
          updated_at: new Date(),
        };
      })
    );
  }, []);

  const getTasksByStatus = useCallback(
    (status: TaskStatus): Task[] => {
      return tasks.filter((task) => task.status === status);
    },
    [tasks]
  );

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByStatus,
  };
}
