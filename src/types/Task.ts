import { TaskStatus } from '../constants/taskStatus';

/**
 * Core task priority levels
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Source of task creation
 */
export type TaskSource = 'manual' | 'gmail' | 'meet' | 'calendar' | 'gemini' | 'linkedin' | 'slack';

/**
 * Simplified task interface
 * Core fields required, extended fields optional for future features
 */
export interface Task {
  // Required fields
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;

  // Optional core fields
  due_date?: Date | null;
  priority?: TaskPriority;
  
  // Recurrence fields
  completed_date?: Date | null;
  recurrence_enabled?: boolean;
  recurrence_days?: number;

  // Extended fields (for future features - AI, CRM integration, etc.)
  source?: TaskSource;
  labels?: string[];
  tags?: string[];
  
  // Extended metadata (optional - can be added as needed)
  assignee?: string;
  client?: string;
  deal_id?: string;
  confidence_score?: number;
  
  // Complex nested objects (optional - only include if needed)
  source_reference?: {
    email_id?: string;
    meeting_id?: string;
    transcript_id?: string;
    original_url?: string;
    snippet?: string;
  };
  
  contact?: {
    name: string;
    email?: string;
    role?: string;
    company?: string;
    linkedin_url?: string;
    avatar?: string;
    last_contact?: Date;
  };
  
  account_info?: {
    contract_value?: string;
    contract_expiry?: Date;
    relationship_duration?: string;
  };
  
  next_actions?: string[];
  recent_activity?: Array<{
    date: Date;
    description: string;
  }>;
}

/**
 * Task creation input (omits auto-generated fields)
 */
export type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at'>;

/**
 * Task update input (all fields optional except id)
 */
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'created_at'>> & {
  id: string;
};
