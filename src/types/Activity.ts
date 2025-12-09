/**
 * Activity interface for CRM
 * Represents a logged interaction/communication with a contact
 */

export type ActivityType = 'email' | 'call' | 'meeting' | 'linkedin' | 'note' | 'task' | 'other';

export interface Activity {
  id: string;
  contact_id?: string | null;
  task_id?: string | null;
  
  // Activity details
  type: ActivityType;
  subject?: string;
  description: string;
  date: Date;
  
  // Source tracking
  source_id?: string; // Email ID, LinkedIn message ID, etc.
  source_url?: string; // Link to original email, LinkedIn message, etc.
  
  // Agent tracking
  created_by_agent?: boolean;
  agent_name?: string; // Name of agent that created this
  
  // Response tracking (BD Analyzer)
  is_outbound?: boolean; // Whether this is an outbound communication
  response_received?: boolean; // Whether a response was received
  response_time_hours?: number; // Hours until response received
  
  created_at: Date;
  updated_at: Date;
}

export type CreateActivityInput = Omit<Activity, 'id' | 'created_at' | 'updated_at'>;
export type UpdateActivityInput = Partial<Omit<Activity, 'id' | 'created_at'>> & {
  id: string;
};

