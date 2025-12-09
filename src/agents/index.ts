/**
 * Agent Foundation
 * 
 * This module exports all agent functions for use throughout the application.
 * In production, these would be called by:
 * - API routes (for server-side processing)
 * - Scheduled jobs (for periodic syncing)
 * - Webhooks (for real-time updates)
 */

export * from './emailAgent';
export * from './linkedinAgent';

/**
 * Agent Status
 * Tracks which agents are active and their last run time
 */
export interface AgentStatus {
  name: string;
  active: boolean;
  lastRun?: Date;
  nextRun?: Date;
  error?: string;
}

/**
 * Get status of all agents
 */
export function getAgentStatus(): AgentStatus[] {
  // TODO: Store agent status in database
  return [
    {
      name: 'email_parser',
      active: false, // Will be enabled when Gmail API is configured
      lastRun: undefined,
    },
    {
      name: 'linkedin_agent',
      active: false, // Will be enabled when LinkedIn API is configured
      lastRun: undefined,
    },
  ];
}

