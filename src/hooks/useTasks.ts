import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types/Task';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Demo data to showcase the sidebar features
const demoTasks: Task[] = [
  {
    id: 'demo-1',
    title: 'Review budget spreadsheet for Q4 expansion',
    description: '',
    due_date: new Date('2025-01-15'),
    priority: 'high',
    status: 'ai_captured',
    source: 'gmail',
    source_reference: {
      email_id: 'msg_abc123',
      snippet: 'Can you review the budget spreadsheet I sent over? We need to finalize the Q4 expansion numbers by next week.',
      original_url: 'https://mail.google.com/mail/u/0/#inbox/msg_abc123',
    },
    confidence_score: 85,
    client: 'Acme Corp',
    deal_id: 'deal_q4_expansion_2025',
    labels: ['budget', 'q4', 'expansion'],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    contact: {
      name: 'John Smith',
      email: 'john@company.com',
      role: 'CFO',
      company: 'Acme Corp',
      last_contact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  },
  {
    id: 'demo-2',
    title: 'Follow up with Jennifer on her proposal to confirm renewal before the contract expires in 5 days',
    description: '',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    priority: 'high',
    status: 'incoming',
    source: 'manual',
    source_reference: {},
    confidence_score: 0,
    client: 'TechCorp Solutions',
    labels: ['renewal', 'enterprise'],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    contact: {
      name: 'Jennifer Martinez',
      role: 'Sales Manager',
      company: 'TechCorp Solutions',
      last_contact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    account_info: {
      contract_value: '$180,000',
      contract_expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      relationship_duration: '3 Years',
    },
    next_actions: [
      'Send premium vs standard comparison',
      'Include 90-day success plan',
      'Schedule final decision meeting',
      'Prepare renewal contracts',
    ],
    recent_activity: [
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Demo scheduled',
      },
      {
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        description: 'Pricing proposal sent',
      },
      {
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        description: 'Renewal discussion initiated',
      },
    ],
    tags: ['high-priority', 'renewal', 'enterprise'],
  },
  {
    id: 'demo-3',
    title: 'Prepare demo for Acme Corp integration review',
    description: 'Technical demo showcasing API integration capabilities',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    status: 'ai_captured',
    source: 'meet',
    source_reference: {
      meeting_id: 'meet_xyz789',
      transcript_id: 'transcript_456',
      snippet: 'We should schedule a technical demo to show how the API integration works with their existing systems.',
      original_url: 'https://meet.google.com/abc-defg-hij',
    },
    confidence_score: 92,
    client: 'Acme Corp',
    deal_id: 'deal_q4_expansion_2025',
    labels: ['demo', 'technical', 'integration'],
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: 'demo-4',
    title: 'Prepare tailored technical proof and integration details for webinar attendee currently evaluating multiple vendors',
    description: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    status: 'todo',
    source: 'manual',
    source_reference: {},
    confidence_score: 0,
    client: 'BrightPath Solutions',
    labels: ['technical', 'evaluation'],
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    contact: {
      name: 'Emma Davis',
      role: 'CTO',
      company: 'BrightPath Solutions',
      last_contact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    tags: ['technical', 'evaluation'],
  },
];

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4aa4529b`;

// Helper to parse dates from JSON
function parseDates(task: any): Task {
  return {
    ...task,
    due_date: task.due_date ? new Date(task.due_date) : null,
    created_at: new Date(task.created_at),
    updated_at: new Date(task.updated_at),
    completed_date: task.completed_date ? new Date(task.completed_date) : null,
    contact: task.contact ? {
      ...task.contact,
      last_contact: task.contact.last_contact ? new Date(task.contact.last_contact) : undefined,
    } : undefined,
    account_info: task.account_info ? {
      ...task.account_info,
      contract_expiry: task.account_info.contract_expiry ? new Date(task.account_info.contract_expiry) : undefined,
    } : undefined,
    recent_activity: task.recent_activity?.map((activity: any) => ({
      ...activity,
      date: new Date(activity.date),
    })),
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for tasks that need to recur
  const checkRecurringTasks = (taskList: Task[]): Task[] => {
    const now = new Date();
    return taskList.map(task => {
      // Check if task is done, has recurrence enabled, and enough time has passed
      if (
        task.status === 'done' && 
        task.recurrence_enabled && 
        task.completed_date
      ) {
        const recurrenceDays = task.recurrence_days || 7; // Default to 7 days
        const daysSinceCompletion = (now.getTime() - task.completed_date.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCompletion >= recurrenceDays) {
          // Move task back to incoming
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
  };

  // Fetch tasks from backend on mount
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch(`${API_BASE}/tasks`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }
        
        const data = await response.json();
        const parsedTasks = data.tasks.map(parseDates);
        const tasksWithRecurrence = checkRecurringTasks(parsedTasks);
        setTasks(tasksWithRecurrence);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        // Initialize with demo data if backend fails
        setTasks(demoTasks);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTasks();
  }, []);

  // Check for recurring tasks periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => {
        const updatedTasks = checkRecurringTasks(prevTasks);
        // Only update if something changed
        if (JSON.stringify(updatedTasks) !== JSON.stringify(prevTasks)) {
          return updatedTasks;
        }
        return prevTasks;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Save tasks to backend whenever they change (but not on initial load)
  useEffect(() => {
    if (!isInitialized) return;

    async function saveTasks() {
      try {
        const response = await fetch(`${API_BASE}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tasks }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save tasks: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error saving tasks:', error);
      }
    }

    saveTasks();
  }, [tasks, isInitialized]);

  const addTask = (title: string, description: string = '', status: TaskStatus = 'incoming') => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      due_date: null,
      priority: 'medium',
      status,
      source: 'manual',
      source_reference: {},
      confidence_score: 0,
      labels: [],
      created_at: new Date(),
      updated_at: new Date(),
      recurrence_enabled: true, // Enable recurrence by default for all tasks
      recurrence_days: 7, // Default to 7 days
    };
    setTasks([...tasks, newTask]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updated_at: new Date() }
          : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const moveTask = (id: string, newStatus: TaskStatus) => {
    const updates: Partial<Task> = { status: newStatus };
    
    // If moving to done, record the completion date
    if (newStatus === 'done') {
      updates.completed_date = new Date();
    }
    // If moving away from done, clear the completion date
    else if (newStatus !== 'done') {
      updates.completed_date = null;
    }
    
    updateTask(id, updates);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByStatus,
    isLoading,
  };
}
