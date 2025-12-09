/**
 * Activity Service
 * Handles all database operations for activities using Supabase
 */

import { Activity, CreateActivityInput, UpdateActivityInput } from '../types/Activity';
import { supabase } from '../lib/supabase';

/**
 * Parse dates from database response
 */
function parseActivityDates(activity: any): Activity {
  const parseDate = (date: string | Date | null | undefined): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    return new Date(date);
  };

  return {
    ...activity,
    created_at: parseDate(activity.created_at),
    updated_at: parseDate(activity.updated_at),
    date: parseDate(activity.date),
    is_outbound: activity.is_outbound ?? false,
    response_received: activity.response_received ?? false,
    response_time_hours: activity.response_time_hours ?? undefined,
  } as Activity;
}

/**
 * Fetch all activities for a contact
 */
export async function fetchActivitiesByContact(contactId: string): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to load activities. Please try again later.');
    }

    return (data || []).map(parseActivityDates);
  } catch (error) {
    console.error('Error in fetchActivitiesByContact:', error);
    throw error;
  }
}

/**
 * Fetch all activities for a task
 */
export async function fetchActivitiesByTask(taskId: string): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('task_id', taskId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to load activities. Please try again later.');
    }

    return (data || []).map(parseActivityDates);
  } catch (error) {
    console.error('Error in fetchActivitiesByTask:', error);
    throw error;
  }
}

/**
 * Fetch all activities (for timeline view)
 */
export async function fetchAllActivities(limit?: number): Promise<Activity[]> {
  try {
    let query = supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to load activities. Please try again later.');
    }

    return (data || []).map(parseActivityDates);
  } catch (error) {
    console.error('Error in fetchAllActivities:', error);
    throw error;
  }
}

/**
 * Create a new activity
 */
export async function createActivity(activityInput: CreateActivityInput): Promise<Activity> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert(activityInput)
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      throw new Error('Failed to create activity. Please try again later.');
    }

    // Update contact's last_contact_date if this is a communication activity
    if (activityInput.contact_id && ['email', 'call', 'meeting', 'linkedin'].includes(activityInput.type)) {
      await supabase
        .from('contacts')
        .update({ last_contact_date: activityInput.date })
        .eq('id', activityInput.contact_id);
    }

    return parseActivityDates(data);
  } catch (error) {
    console.error('Error in createActivity:', error);
    throw error;
  }
}

/**
 * Update an existing activity
 */
export async function updateActivity(id: string, updates: UpdateActivityInput): Promise<Activity> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity:', error);
      throw new Error('Failed to update activity. Please try again later.');
    }

    return parseActivityDates(data);
  } catch (error) {
    console.error('Error in updateActivity:', error);
    throw error;
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity:', error);
      throw new Error('Failed to delete activity. Please try again later.');
    }
  } catch (error) {
    console.error('Error in deleteActivity:', error);
    throw error;
  }
}

