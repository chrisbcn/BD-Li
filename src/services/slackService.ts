/**
 * Slack Service
 * Handles Slack API authentication and message fetching
 */

import { aiConfig } from '../config/ai';

export interface SlackMessage {
  id: string;
  text: string;
  user: string;
  userName?: string;
  timestamp: string;
  channel: string;
  channelName?: string;
  threadTs?: string;
  reactions?: Array<{
    name: string;
    count: number;
  }>;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
}

export interface SlackAuthState {
  isAuthenticated: boolean;
  teamName?: string;
  error?: string;
}

// Store token in memory (in production, should be in Supabase)
let botToken: string | null = null;

/**
 * Set Slack bot token
 */
export function setSlackToken(token: string) {
  botToken = token;
}

/**
 * Check if Slack is authenticated
 */
export function isSlackAuthenticated(): boolean {
  return !!botToken || !!aiConfig.slack.botToken;
}

/**
 * Get active bot token
 */
function getToken(): string {
  const token = botToken || aiConfig.slack.botToken;
  if (!token) {
    throw new Error('Slack not authenticated');
  }
  return token;
}

/**
 * Make Slack API request
 */
async function slackAPI(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  const token = getToken();
  
  const url = new URL(`https://slack.com/api/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Slack API error');
  }

  return data;
}

/**
 * Test authentication
 */
export async function testAuth(): Promise<SlackAuthState> {
  try {
    const data = await slackAPI('auth.test');
    return {
      isAuthenticated: true,
      teamName: data.team,
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * List channels
 */
export async function listChannels(): Promise<SlackChannel[]> {
  try {
    const data = await slackAPI('conversations.list', {
      types: 'public_channel,private_channel',
      exclude_archived: true,
    });

    return (data.channels || []).map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
      isMember: channel.is_member,
    }));
  } catch (error) {
    console.error('Error listing channels:', error);
    return [];
  }
}

/**
 * List direct messages
 */
export async function listDMs(): Promise<SlackChannel[]> {
  try {
    const data = await slackAPI('conversations.list', {
      types: 'im',
      exclude_archived: true,
    });

    return (data.channels || []).map((channel: any) => ({
      id: channel.id,
      name: `DM with ${channel.user}`,
      isPrivate: true,
      isMember: true,
    }));
  } catch (error) {
    console.error('Error listing DMs:', error);
    return [];
  }
}

/**
 * Fetch messages from a channel
 */
export async function fetchChannelMessages(
  channelId: string,
  limit: number = 100,
  oldest?: string
): Promise<SlackMessage[]> {
  try {
    // Get channel info first
    const channelInfo = await slackAPI('conversations.info', { channel: channelId });
    const channelName = channelInfo.channel?.name || 'Unknown';

    // Get messages
    const data = await slackAPI('conversations.history', {
      channel: channelId,
      limit,
      oldest,
    });

    const messages: SlackMessage[] = [];

    for (const message of data.messages || []) {
      // Skip bot messages and system messages
      if (message.bot_id || message.subtype) continue;

      // Get user info
      let userName = 'Unknown User';
      if (message.user) {
        try {
          const userInfo = await slackAPI('users.info', { user: message.user });
          userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown User';
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      }

      messages.push({
        id: message.ts,
        text: message.text || '',
        user: message.user || '',
        userName,
        timestamp: message.ts,
        channel: channelId,
        channelName,
        threadTs: message.thread_ts,
        reactions: message.reactions?.map((r: any) => ({
          name: r.name,
          count: r.count,
        })),
      });
    }

    return messages;
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    throw error;
  }
}

/**
 * Fetch recent messages from multiple channels
 */
export async function fetchRecentMessages(
  channelIds: string[],
  limit: number = 50
): Promise<SlackMessage[]> {
  const allMessages: SlackMessage[] = [];

  // Calculate oldest timestamp (last 7 days)
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

  for (const channelId of channelIds) {
    try {
      const messages = await fetchChannelMessages(
        channelId,
        limit,
        sevenDaysAgo.toString()
      );
      allMessages.push(...messages);
    } catch (error) {
      console.error(`Error fetching messages from channel ${channelId}:`, error);
    }
  }

  // Sort by timestamp (most recent first)
  allMessages.sort((a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp));

  return allMessages.slice(0, limit);
}

/**
 * Get user info
 */
export async function getUserInfo(userId: string): Promise<{
  name: string;
  email?: string;
  avatar?: string;
}> {
  try {
    const data = await slackAPI('users.info', { user: userId });
    const user = data.user;

    return {
      name: user.real_name || user.name || 'Unknown User',
      email: user.profile?.email,
      avatar: user.profile?.image_72,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return {
      name: 'Unknown User',
    };
  }
}


