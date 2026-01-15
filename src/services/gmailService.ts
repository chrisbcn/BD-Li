/**
 * Gmail Service
 * Handles Gmail API authentication and email fetching
 * 
 * NOTE: This is a placeholder for the Gmail integration.
 * The actual Gmail API calls should be made from a backend/Edge Function
 * because googleapis is a Node.js-only package.
 */

import { aiConfig } from '../config/ai';

// Placeholder type since we can't import googleapis in browser
type OAuth2Client = any;

export interface GmailMessage {
  id: string;
  threadId: string;
  from: {
    name: string;
    email: string;
  };
  to: string[];
  subject: string;
  body: string;
  snippet: string;
  date: Date;
  labels: string[];
}

export interface GmailAuthState {
  isAuthenticated: boolean;
  email?: string;
  error?: string;
}

// Store token in memory (in production, this should be in Supabase)
let accessToken: string | null = null;
let refreshToken: string | null = null;

/**
 * Initialize Gmail OAuth
 * TODO: This should be implemented in a Supabase Edge Function
 */
export function initGmailAuth(): OAuth2Client {
  console.warn('Gmail OAuth not yet implemented - requires backend integration');
  return null;
}

/**
 * Get Gmail authorization URL
 * TODO: This should be implemented in a Supabase Edge Function
 */
export function getGmailAuthUrl(): string {
  console.warn('Gmail OAuth not yet implemented - requires backend integration');
  // Return a placeholder for now
  return '#gmail-auth-not-configured';
}

/**
 * Handle OAuth callback
 * TODO: This should be implemented in a Supabase Edge Function
 */
export async function handleGmailCallback(code: string): Promise<GmailAuthState> {
  console.warn('Gmail OAuth not yet implemented - requires backend integration');
  return {
    isAuthenticated: false,
    error: 'Gmail integration requires backend implementation',
  };
}

/**
 * Check if Gmail is authenticated
 */
export function isGmailAuthenticated(): boolean {
  return !!accessToken;
}

/**
 * Set Gmail access token (from storage)
 */
export function setGmailToken(token: string, refresh?: string) {
  accessToken = token;
  if (refresh) {
    refreshToken = refresh;
  }
}

/**
 * Get authenticated Gmail client
 * TODO: This should be implemented in a Supabase Edge Function
 */
function getGmailClient(): any {
  throw new Error('Gmail API requires backend implementation - use Supabase Edge Function');
}

/**
 * Fetch unread emails
 * TODO: This should be implemented in a Supabase Edge Function
 */
export async function fetchUnreadEmails(maxResults: number = 50): Promise<GmailMessage[]> {
  console.warn('Gmail API not yet implemented - requires backend integration');
  return [];
}

/**
 * Fetch emails from last N days
 * TODO: This should be implemented in a Supabase Edge Function
 */
export async function fetchRecentEmails(days: number = 7, maxResults: number = 50): Promise<GmailMessage[]> {
  console.warn('Gmail API not yet implemented - requires backend integration');
  return [];
}

/**
 * Parse Gmail message data
 */
function parseGmailMessage(data: any): GmailMessage | null {
  try {
    const headers = data.payload?.headers || [];
    
    const getHeader = (name: string): string => {
      const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const fromHeader = getHeader('from');
    const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || [null, fromHeader, fromHeader];
    
    const to = getHeader('to').split(',').map(t => t.trim());
    const subject = getHeader('subject');
    const dateStr = getHeader('date');

    // Extract body
    let body = '';
    if (data.payload?.body?.data) {
      body = Buffer.from(data.payload.body.data, 'base64').toString('utf-8');
    } else if (data.payload?.parts) {
      // Multi-part email
      const textPart = findTextPart(data.payload.parts);
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    // Clean HTML if present
    body = stripHtml(body);

    return {
      id: data.id || '',
      threadId: data.threadId || '',
      from: {
        name: fromMatch[1]?.trim() || '',
        email: fromMatch[2]?.trim() || '',
      },
      to,
      subject,
      body,
      snippet: data.snippet || '',
      date: new Date(dateStr),
      labels: data.labelIds || [],
    };
  } catch (error) {
    console.error('Error parsing message:', error);
    return null;
  }
}

/**
 * Find text part in multipart email
 */
function findTextPart(parts: any[]): any {
  for (const part of parts) {
    if (part.mimeType === 'text/plain') {
      return part;
    }
    if (part.parts) {
      const found = findTextPart(part.parts);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Mark email as read (optional, for after processing)
 * TODO: This should be implemented in a Supabase Edge Function
 */
export async function markEmailAsRead(messageId: string): Promise<void> {
  console.warn('Gmail API not yet implemented - requires backend integration');
}

