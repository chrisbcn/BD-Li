export type TaskStatus = 'incoming' | 'ai_captured' | 'todo' | 'done';
export type TaskSource = 'manual' | 'gmail' | 'meet' | 'calendar' | 'gemini';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskSourceReference {
  email_id?: string;
  meeting_id?: string;
  transcript_id?: string;
  original_url?: string;
  snippet?: string;
}

export interface TaskContact {
  name: string;
  email?: string;
  role?: string;
  company?: string;
  avatar?: string;
  last_contact?: Date;
}

export interface TaskAccountInfo {
  contract_value?: string;
  contract_expiry?: Date;
  relationship_duration?: string;
}

export interface TaskActivity {
  date: Date;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: Date | null;
  priority?: TaskPriority;
  status: TaskStatus;
  source?: TaskSource;
  source_reference?: TaskSourceReference;
  confidence_score?: number; // 0-100 for AI tasks
  assignee?: string;
  client?: string;
  deal_id?: string;
  labels?: string[];
  created_at: Date;
  updated_at: Date;
  completed_date?: Date | null; // When task was completed
  recurrence_enabled?: boolean; // Whether to auto-recur after completion
  recurrence_days?: number; // Days until recurrence (default: 7)
  // Legacy fields for existing functionality
  contact?: TaskContact;
  account_info?: TaskAccountInfo;
  next_actions?: string[];
  recent_activity?: TaskActivity[];
  tags?: string[];
}
