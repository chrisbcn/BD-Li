/**
 * LinkedIn Agent
 * Tracks LinkedIn connections and suggests who to reconnect with
 * 
 * This is the foundation for the LinkedIn relationship tracking agent.
 * In production, this would:
 * 1. Connect to LinkedIn API (or scrape with permission)
 * 2. Sync connections to contacts
 * 3. Track mutual connections
 * 4. Calculate relationship strength
 * 5. Suggest contacts to reconnect with
 */

import { Contact, CreateContactInput, UpdateContactInput } from '../types/Contact';
import { Task, CreateTaskInput } from '../types/Task';
import { Activity, CreateActivityInput } from '../types/Activity';
import * as contactService from '../services/contactService';
import * as taskService from '../services/taskService';
import * as activityService from '../services/activityService';

export interface LinkedInConnection {
  id: string;
  name: string;
  headline?: string;
  company?: string;
  location?: string;
  profileUrl: string;
  mutualConnections?: string[]; // Array of connection IDs
  lastInteraction?: Date;
}

export interface ReconnectionSuggestion {
  contact: Contact;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  suggestedAction: string;
}

/**
 * Sync LinkedIn connection to CRM contact
 */
export async function syncLinkedInConnection(
  connection: LinkedInConnection
): Promise<Contact> {
  // Try to find existing contact by LinkedIn URL or email
  const contacts = await contactService.fetchContacts();
  let existingContact = contacts.find(
    (c) => c.linkedin_url === connection.profileUrl
  );
  
  if (existingContact) {
    // Update existing contact with LinkedIn data
    const updates: UpdateContactInput = {
      id: existingContact.id,
      name: connection.name,
      company: connection.company || existingContact.company,
      job_title: connection.headline || existingContact.job_title,
      linkedin_url: connection.profileUrl,
      source: 'linkedin',
    };
    
    // Update mutual connections
    if (connection.mutualConnections && connection.mutualConnections.length > 0) {
      // Map mutual connection IDs to contact IDs
      const mutualContactIds = connection.mutualConnections
        .map((mutualId) => {
          const mutualContact = contacts.find((c) => 
            c.linkedin_url?.includes(mutualId) || c.id === mutualId
          );
          return mutualContact?.id;
        })
        .filter((id): id is string => !!id);
      
      updates.mutual_connections = mutualContactIds;
    }
    
    return await contactService.updateContact(existingContact.id, updates);
  }
  
  // Create new contact
  const newContact = await contactService.createContact({
    name: connection.name,
    company: connection.company,
    job_title: connection.headline,
    linkedin_url: connection.profileUrl,
    source: 'linkedin',
  });
  
  return newContact;
}

/**
 * Calculate relationship strength for a contact
 */
function calculateRelationshipStrength(contact: Contact): number {
  return contactService.calculateRelationshipStrength(contact);
}

/**
 * Get contacts that should be reconnected with
 */
export async function getReconnectionSuggestions(): Promise<ReconnectionSuggestion[]> {
  const contactsToReconnect = await contactService.getContactsToReconnect();
  
  return contactsToReconnect.map((contact) => {
    const daysSinceLastContact = contact.last_contact_date
      ? Math.floor(
          (Date.now() - new Date(contact.last_contact_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : Infinity;
    
    const frequency = contact.communication_frequency_days || 30;
    const relationshipStrength = calculateRelationshipStrength(contact);
    
    let reason: string;
    let priority: 'high' | 'medium' | 'low';
    let suggestedAction: string;
    
    if (!contact.last_contact_date) {
      reason = 'Never contacted';
      priority = 'medium';
      suggestedAction = 'Send initial outreach message';
    } else if (daysSinceLastContact > frequency * 3) {
      reason = `Haven't contacted in ${daysSinceLastContact} days (normal frequency: ${frequency} days)`;
      priority = 'high';
      suggestedAction = 'Reconnect with personalized message';
    } else if (daysSinceLastContact > frequency * 2) {
      reason = `Haven't contacted in ${daysSinceLastContact} days`;
      priority = 'medium';
      suggestedAction = 'Schedule a catch-up';
    } else {
      reason = `Due for regular check-in (${daysSinceLastContact} days since last contact)`;
      priority = 'low';
      suggestedAction = 'Send a quick check-in message';
    }
    
    // Boost priority if high-value contact
    if (contact.company && contact.job_title) {
      if (priority === 'low') priority = 'medium';
      if (priority === 'medium') priority = 'high';
    }
    
    return {
      contact,
      reason,
      priority,
      suggestedAction,
    };
  });
}

/**
 * Create tasks for reconnection suggestions
 */
export async function createReconnectionTasks(
  suggestions: ReconnectionSuggestion[]
): Promise<Task[]> {
  const tasks: Task[] = [];
  
  for (const suggestion of suggestions) {
    // Only create tasks for high and medium priority suggestions
    if (suggestion.priority === 'low') continue;
    
    const taskInput: CreateTaskInput = {
      title: `Reconnect with ${suggestion.contact.name}`,
      description: `${suggestion.reason}\n\nSuggested action: ${suggestion.suggestedAction}`,
      status: 'incoming',
      priority: suggestion.priority === 'high' ? 'high' : 'medium',
      source: 'linkedin',
      contact_id: suggestion.contact.id,
      tags: ['reconnection', 'linkedin'],
    };
    
    const task = await taskService.addTask(taskInput);
    tasks.push(task);
    
    // Create activity record
    await activityService.createActivity({
      contact_id: suggestion.contact.id,
      task_id: task.id,
      type: 'linkedin',
      description: `Reconnection suggestion: ${suggestion.reason}`,
      date: new Date(),
      created_by_agent: true,
      agent_name: 'linkedin_agent',
    });
  }
  
  return tasks;
}

/**
 * Sync all LinkedIn connections
 */
export async function syncLinkedInConnections(
  connections: LinkedInConnection[]
): Promise<{
  contacts: Contact[];
  tasks: Task[];
}> {
  const contacts: Contact[] = [];
  
  // Sync all connections
  for (const connection of connections) {
    try {
      const contact = await syncLinkedInConnection(connection);
      contacts.push(contact);
    } catch (error) {
      console.error(`Error syncing connection ${connection.id}:`, error);
    }
  }
  
  // Get reconnection suggestions
  const suggestions = await getReconnectionSuggestions();
  
  // Create tasks for high-priority suggestions
  const tasks = await createReconnectionTasks(suggestions);
  
  return {
    contacts,
    tasks,
  };
}

/**
 * Track LinkedIn interaction (message, profile view, etc.)
 */
export async function trackLinkedInInteraction(
  contactId: string,
  interactionType: 'message' | 'profile_view' | 'connection',
  description: string
): Promise<Activity> {
  // Update contact's last_contact_date
  const contact = await contactService.fetchContactById(contactId);
  if (contact) {
    await contactService.updateContact(contactId, {
      last_contact_date: new Date(),
    });
  }
  
  // Create activity
  return await activityService.createActivity({
    contact_id: contactId,
    type: 'linkedin',
    description,
    date: new Date(),
    created_by_agent: true,
    agent_name: 'linkedin_agent',
  });
}

