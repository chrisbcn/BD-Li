/**
 * Email Agent
 * Extracts tasks from emails and creates them in the CRM
 * 
 * This is the foundation for the email parsing agent.
 * In production, this would:
 * 1. Connect to Gmail API
 * 2. Use Gemini to parse emails and extract tasks
 * 3. Create tasks and link to contacts
 * 4. Create activity records
 */

import { Task, CreateTaskInput } from '../types/Task';
import { Contact, CreateContactInput } from '../types/Contact';
import { Activity, CreateActivityInput } from '../types/Activity';
import * as taskService from '../services/taskService';
import * as contactService from '../services/contactService';
import * as activityService from '../services/activityService';
import { supabase } from '../lib/supabase';

export interface EmailData {
  id: string;
  from: {
    name: string;
    email: string;
  };
  subject: string;
  body: string;
  date: Date;
  threadId?: string;
}

export interface ExtractedTask {
  title: string;
  description: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
}

export interface GmailScanOptions {
  days?: number;
  maxResults?: number;
  unreadOnly?: boolean;
}

/**
 * Parse email content to extract tasks
 * In production, this would use Gemini API to intelligently extract tasks
 */
export async function parseEmailForTasks(email: EmailData): Promise<ExtractedTask[]> {
  // TODO: Replace with Gemini API call
  // For now, this is a placeholder that looks for common task patterns
  
  const tasks: ExtractedTask[] = [];
  const body = email.body.toLowerCase();
  
  // Look for action items (simple pattern matching - replace with AI in production)
  const actionPatterns = [
    /(?:please|can you|could you|need to|should|must)\s+(.+?)(?:\.|$)/gi,
    /(?:todo|action|task):\s*(.+?)(?:\.|$)/gi,
    /follow up on (.+?)(?:\.|$)/gi,
  ];
  
  actionPatterns.forEach((pattern) => {
    const matches = body.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 5) {
        tasks.push({
          title: match[1].trim(),
          description: `Extracted from email: ${email.subject}`,
          priority: 'medium',
          confidence: 70, // Would be calculated by AI
        });
      }
    }
  });
  
  // If no tasks found, check if the email itself is actionable
  if (tasks.length === 0 && (body.includes('reply') || body.includes('respond'))) {
    tasks.push({
      title: `Reply to: ${email.subject}`,
      description: `Email from ${email.from.name}: ${email.body.substring(0, 200)}...`,
      priority: 'medium',
      confidence: 60,
    });
  }
  
  return tasks;
}

/**
 * Find or create contact from email
 */
export async function findOrCreateContact(email: EmailData): Promise<Contact> {
  // Try to find existing contact by email
  const contacts = await contactService.fetchContacts();
  const existingContact = contacts.find((c) => c.email === email.from.email);
  
  if (existingContact) {
    return existingContact;
  }
  
  // Create new contact
  const newContact = await contactService.createContact({
    name: email.from.name,
    email: email.from.email,
    source: 'gmail',
  });
  
  return newContact;
}

/**
 * Process email and create tasks
 * Main entry point for the email agent
 */
export async function processEmail(email: EmailData): Promise<{
  tasks: Task[];
  contact: Contact;
  activity: Activity;
}> {
  // Extract tasks from email
  const extractedTasks = await parseEmailForTasks(email);
  
  if (extractedTasks.length === 0) {
    throw new Error('No tasks found in email');
  }
  
  // Find or create contact
  const contact = await findOrCreateContact(email);
  
  // Create tasks
  const createdTasks: Task[] = [];
  for (const extractedTask of extractedTasks) {
    const taskInput: CreateTaskInput = {
      title: extractedTask.title,
      description: extractedTask.description,
      status: 'ai_captured',
      priority: extractedTask.priority,
      due_date: extractedTask.dueDate || null,
      source: 'gmail',
      confidence_score: extractedTask.confidence,
      contact_id: contact.id,
      source_reference: {
        email_id: email.id,
        snippet: email.body.substring(0, 200),
      },
    };
    
    const task = await taskService.addTask(taskInput);
    createdTasks.push(task);
  }
  
  // Create activity record
  const activity = await activityService.createActivity({
    contact_id: contact.id,
    task_id: createdTasks[0]?.id,
    type: 'email',
    subject: email.subject,
    description: `Email received: ${email.subject}`,
    date: email.date,
    source_id: email.id,
    created_by_agent: true,
    agent_name: 'email_parser',
  });
  
  return {
    tasks: createdTasks,
    contact,
    activity,
  };
}

/**
 * Batch process multiple emails
 */
export async function processEmails(emails: EmailData[]): Promise<{
  tasks: Task[];
  contacts: Contact[];
  activities: Activity[];
}> {
  const allTasks: Task[] = [];
  const allContacts: Contact[] = [];
  const allActivities: Activity[] = [];
  
  for (const email of emails) {
    try {
      const result = await processEmail(email);
      allTasks.push(...result.tasks);
      if (!allContacts.find((c) => c.id === result.contact.id)) {
        allContacts.push(result.contact);
      }
      allActivities.push(result.activity);
    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);
    }
  }
  
  return {
    tasks: allTasks,
    contacts: allContacts,
    activities: allActivities,
  };
}

/**
 * Trigger Gmail auto-scan via Edge Function
 */
export async function scanGmailForTasks(options: GmailScanOptions = {}): Promise<{
  messagesScanned: number;
  tasksCreated: number;
  tasksSkipped: number;
}> {
  const { data, error } = await supabase.functions.invoke('gmail-scan', {
    body: {
      days: options.days ?? 7,
      maxResults: options.maxResults ?? 20,
      unreadOnly: options.unreadOnly ?? true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Gmail scan failed');
  }

  return {
    messagesScanned: data.messagesScanned ?? 0,
    tasksCreated: data.tasksCreated ?? 0,
    tasksSkipped: data.tasksSkipped ?? 0,
  };
}

