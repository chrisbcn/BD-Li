/**
 * Contact Service
 * Handles all database operations for contacts using Supabase
 */

import { Contact, CreateContactInput, UpdateContactInput } from '../types/Contact';
import { supabase } from '../lib/supabase';

/**
 * Parse dates from database response
 */
function parseContactDates(contact: any): Contact {
  const parseDate = (date: string | Date | null | undefined): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    return new Date(date);
  };

  return {
    ...contact,
    created_at: parseDate(contact.created_at) || new Date(),
    updated_at: parseDate(contact.updated_at) || new Date(),
    last_contact_date: parseDate(contact.last_contact_date),
  } as Contact;
}

/**
 * Fetch all contacts from the database
 */
export async function fetchContacts(): Promise<Contact[]> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('last_contact_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('Failed to load contacts. Please try again later.');
    }

    return (data || []).map(parseContactDates);
  } catch (error) {
    console.error('Error in fetchContacts:', error);
    throw error;
  }
}

/**
 * Fetch a single contact by ID
 */
export async function fetchContactById(id: string): Promise<Contact | null> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching contact:', error);
      throw new Error('Failed to load contact. Please try again later.');
    }

    return data ? parseContactDates(data) : null;
  } catch (error) {
    console.error('Error in fetchContactById:', error);
    throw error;
  }
}

/**
 * Create a new contact
 */
export async function createContact(contactInput: CreateContactInput): Promise<Contact> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contactInput)
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      throw new Error('Failed to create contact. Please try again later.');
    }

    return parseContactDates(data);
  } catch (error) {
    console.error('Error in createContact:', error);
    throw error;
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(id: string, updates: UpdateContactInput): Promise<Contact> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      throw new Error('Failed to update contact. Please try again later.');
    }

    return parseContactDates(data);
  } catch (error) {
    console.error('Error in updateContact:', error);
    throw error;
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contact:', error);
      throw new Error('Failed to delete contact. Please try again later.');
    }
  } catch (error) {
    console.error('Error in deleteContact:', error);
    throw error;
  }
}

/**
 * Calculate relationship strength based on communication frequency
 * This will be used by agents to suggest who to reconnect with
 */
export function calculateRelationshipStrength(contact: Contact): number {
  if (!contact.last_contact_date) return 0;
  
  const daysSinceLastContact = Math.floor(
    (Date.now() - new Date(contact.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const frequency = contact.communication_frequency_days || 30;
  
  // If we haven't contacted in a while relative to our frequency, relationship is weaker
  if (daysSinceLastContact > frequency * 2) {
    return Math.max(0, 50 - (daysSinceLastContact - frequency * 2) / 10);
  }
  
  // If we're within normal frequency, relationship is strong
  return Math.min(100, 50 + (frequency - daysSinceLastContact) / frequency * 50);
}

/**
 * Get contacts that should be reconnected with
 * Returns contacts sorted by priority (who should be contacted soonest)
 */
export async function getContactsToReconnect(): Promise<Contact[]> {
  const contacts = await fetchContacts();
  
  return contacts
    .map(contact => ({
      ...contact,
      relationship_strength: calculateRelationshipStrength(contact),
    }))
    .filter(contact => {
      if (!contact.last_contact_date) return true; // Never contacted
      
      const daysSinceLastContact = Math.floor(
        (Date.now() - new Date(contact.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const frequency = contact.communication_frequency_days || 30;
      
      // Suggest reconnecting if it's been longer than the frequency
      return daysSinceLastContact > frequency;
    })
    .sort((a, b) => {
      // Sort by relationship strength (lower = more urgent)
      const strengthA = a.relationship_strength || 0;
      const strengthB = b.relationship_strength || 0;
      return strengthA - strengthB;
    });
}

