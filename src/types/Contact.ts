/**
 * Contact interface for CRM
 * Represents a person in the CRM system
 */

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  linkedin_url?: string;
  avatar_url?: string;
  notes?: string;
  
  // Relationship tracking
  last_contact_date?: Date | null;
  communication_frequency_days?: number; // Average days between communications
  relationship_strength?: number; // 0-100 score
  mutual_connections?: string[]; // Array of contact IDs
  
  // BD Analyzer lead scoring
  lead_score?: number; // 0-100 lead score
  temperature?: 'hot' | 'warm' | 'cold'; // Temperature classification
  response_rate?: number; // Response rate percentage (0-100)
  
  // Metadata
  source?: 'manual' | 'gmail' | 'linkedin' | 'calendar' | 'meet' | 'gemini';
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export type CreateContactInput = Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
export type UpdateContactInput = Partial<Omit<Contact, 'id' | 'created_at'>> & {
  id: string;
};

