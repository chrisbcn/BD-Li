/**
 * Lead Scoring Service
 * Implements BD Analyzer's lead scoring algorithm
 * 
 * Scoring Formula:
 * - Recency (40%): Days since last interaction
 * - Frequency (30%): Number of recent interactions
 * - Engagement (30%): Response rate to outreach
 * 
 * Temperature Classification:
 * - Hot (71-100): Immediate sales opportunities
 * - Warm (31-70): Nurturing required
 * - Cold (0-30): Long-term prospects
 */

import { Contact } from '../types/Contact';
import { Activity, ActivityType } from '../types/Activity';
import * as activityService from './activityService';

export type Temperature = 'hot' | 'warm' | 'cold';

export interface LeadScore {
  total: number; // 0-100
  recency: number; // 0-40
  frequency: number; // 0-30
  engagement: number; // 0-30
  temperature: Temperature;
}

/**
 * Calculate recency score (0-40 points)
 * More recent = higher score
 */
function calculateRecencyScore(contact: Contact): number {
  if (!contact.last_contact_date) return 0;
  
  const daysSinceLastContact = Math.floor(
    (Date.now() - new Date(contact.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Score decreases as days increase
  // 0 days = 40 points, 90+ days = 0 points
  if (daysSinceLastContact === 0) return 40;
  if (daysSinceLastContact <= 7) return 40 - (daysSinceLastContact * 2);
  if (daysSinceLastContact <= 30) return 26 - ((daysSinceLastContact - 7) * 0.5);
  if (daysSinceLastContact <= 90) return 15 - ((daysSinceLastContact - 30) * 0.25);
  return 0;
}

/**
 * Calculate frequency score (0-30 points)
 * More interactions in last 90 days = higher score
 */
async function calculateFrequencyScore(contact: Contact): Promise<number> {
  if (!contact.id) return 0;
  
  try {
    const activities = await activityService.fetchActivitiesByContact(contact.id);
    
    // Count interactions in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentActivities = activities.filter(
      (activity) => new Date(activity.date) >= ninetyDaysAgo
    );
    
    const interactionCount = recentActivities.length;
    
    // Score based on interaction count
    // 10+ interactions = 30 points, 0 interactions = 0 points
    if (interactionCount >= 10) return 30;
    if (interactionCount >= 5) return 20;
    if (interactionCount >= 3) return 15;
    if (interactionCount >= 1) return 10;
    return 0;
  } catch (error) {
    console.error('Error calculating frequency score:', error);
    return 0;
  }
}

/**
 * Calculate engagement score (0-30 points)
 * Based on response rate to outreach
 */
async function calculateEngagementScore(contact: Contact): Promise<number> {
  if (!contact.id) return 0;
  
  try {
    const activities = await activityService.fetchActivitiesByContact(contact.id);
    
    // Separate sent vs received activities
    const sentActivities: Activity[] = [];
    const receivedActivities: Activity[] = [];
    
    // For now, we'll use a simple heuristic:
    // - Emails we sent (outbound)
    // - Emails they sent (inbound)
    // - Responses to our messages
    
    // TODO: Enhance this with actual response tracking
    // For now, if we have any inbound activity, assume engagement
    const hasInboundActivity = activities.some(
      (activity) => activity.type === 'email' && activity.created_by_agent
    );
    
    // Calculate response rate
    // If we have recent inbound activity, engagement is high
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentInbound = activities.filter(
      (activity) =>
        new Date(activity.date) >= ninetyDaysAgo &&
        (activity.type === 'email' || activity.type === 'linkedin')
    );
    
    const recentOutbound = activities.filter(
      (activity) =>
        new Date(activity.date) >= ninetyDaysAgo &&
        activity.type === 'email' &&
        !activity.created_by_agent
    );
    
    if (recentOutbound.length === 0) return 15; // Neutral if no outreach
    
    const responseRate = recentInbound.length / recentOutbound.length;
    
    // Score based on response rate
    // 100% response = 30 points, 0% response = 0 points
    return Math.min(30, Math.round(responseRate * 30));
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    return 0;
  }
}

/**
 * Calculate complete lead score for a contact
 */
export async function calculateLeadScore(contact: Contact): Promise<LeadScore> {
  const recency = calculateRecencyScore(contact);
  const frequency = await calculateFrequencyScore(contact);
  const engagement = await calculateEngagementScore(contact);
  
  const total = recency + frequency + engagement;
  
  // Determine temperature
  let temperature: Temperature;
  if (total >= 71) {
    temperature = 'hot';
  } else if (total >= 31) {
    temperature = 'warm';
  } else {
    temperature = 'cold';
  }
  
  return {
    total,
    recency,
    frequency,
    engagement,
    temperature,
  };
}

/**
 * Get temperature classification from score
 */
export function getTemperatureFromScore(score: number): Temperature {
  if (score >= 71) return 'hot';
  if (score >= 31) return 'warm';
  return 'cold';
}

/**
 * Get temperature color for UI
 */
export function getTemperatureColor(temperature: Temperature): string {
  switch (temperature) {
    case 'hot':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'warm':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'cold':
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
}

/**
 * Batch calculate lead scores for multiple contacts
 */
export async function calculateLeadScoresForContacts(
  contacts: Contact[]
): Promise<Map<string, LeadScore>> {
  const scores = new Map<string, LeadScore>();
  
  for (const contact of contacts) {
    try {
      const score = await calculateLeadScore(contact);
      scores.set(contact.id, score);
    } catch (error) {
      console.error(`Error calculating score for contact ${contact.id}:`, error);
    }
  }
  
  return scores;
}

