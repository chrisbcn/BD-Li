/**
 * Supabase Edge Function: gmail-scan
 *
 * Scans Gmail messages for actionable tasks and inserts them into Incoming.
 * Uses OAuth refresh token (workspace account) stored in env vars.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailScanRequest {
  days?: number;
  maxResults?: number;
  query?: string;
  unreadOnly?: boolean;
}

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers?: GmailMessageHeader[];
    body?: { data?: string };
    parts?: Array<{
      mimeType?: string;
      body?: { data?: string };
      parts?: any[];
    }>;
  };
}

async function getGmailAccessToken() {
  const clientId = Deno.env.get('GMAIL_CLIENT_ID');
  const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN not configured');
  }

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResp.ok) {
    const errorText = await tokenResp.text();
    throw new Error(`Failed to refresh Gmail token: ${tokenResp.status} - ${errorText}`);
  }

  const tokenData = await tokenResp.json();
  return tokenData.access_token as string;
}

function getHeader(headers: GmailMessageHeader[] = [], name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBase64(data?: string) {
  if (!data) return '';
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return atob(normalized);
}

function findTextPart(parts?: any[]): string {
  if (!parts) return '';
  for (const part of parts) {
    if (part?.mimeType === 'text/plain' && part?.body?.data) {
      return decodeBase64(part.body.data);
    }
    if (part?.parts) {
      const nested = findTextPart(part.parts);
      if (nested) return nested;
    }
  }
  return '';
}

async function extractTasksFromEmail(
  supabaseUrl: string,
  anonKey: string,
  content: string,
  metadata: Record<string, string>
) {
  const response = await fetch(`${supabaseUrl}/functions/v1/extract-tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      content,
      source: {
        type: 'gmail',
        metadata,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`extract-tasks failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const gmailUser = Deno.env.get('GMAIL_USER_EMAIL') || 'me';

    if (!supabaseUrl || !supabaseKey || !supabaseAnonKey) {
      throw new Error('Supabase env vars not configured');
    }

    const { days = 7, maxResults = 20, query, unreadOnly = true }: GmailScanRequest = await req.json();

    const gmailAccessToken = await getGmailAccessToken();

    const searchQuery = query || `${unreadOnly ? 'is:unread ' : ''}newer_than:${days}d`;
    const listResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(gmailUser)}/messages?maxResults=${maxResults}&q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${gmailAccessToken}`,
        },
      }
    );

    if (!listResp.ok) {
      const errorText = await listResp.text();
      throw new Error(`Gmail list error: ${listResp.status} - ${errorText}`);
    }

    const listData = await listResp.json();
    const messages: Array<{ id: string; threadId: string }> = listData.messages || [];

    const supabase = createClient(supabaseUrl, supabaseKey);
    let tasksCreated = 0;
    let tasksSkipped = 0;

    for (const message of messages) {
      const messageResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(gmailUser)}/messages/${message.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${gmailAccessToken}`,
          },
        }
      );

      if (!messageResp.ok) {
        tasksSkipped += 1;
        continue;
      }

      const messageData: GmailMessage = await messageResp.json();
      const headers = messageData.payload?.headers || [];
      const subject = getHeader(headers, 'subject');
      const from = getHeader(headers, 'from');
      const date = getHeader(headers, 'date');

      const rawBody = messageData.payload?.body?.data
        ? decodeBase64(messageData.payload.body.data)
        : findTextPart(messageData.payload?.parts);

      const content = `Subject: ${subject}\nFrom: ${from}\nDate: ${date}\n\n${rawBody || messageData.snippet}`;

      const { data: existing } = await supabase
        .from('tasks')
        .select('id')
        .contains('source_reference', { email_id: messageData.id })
        .limit(1);

      if (existing && existing.length > 0) {
        tasksSkipped += 1;
        continue;
      }

      const aiResult = await extractTasksFromEmail(
        supabaseUrl,
        supabaseAnonKey,
        content,
        { from, subject, date }
      );

      const extractedTasks = aiResult.tasks || [];
      if (extractedTasks.length === 0) {
        tasksSkipped += 1;
        continue;
      }

      for (const task of extractedTasks) {
        const insertPayload = {
          title: task.title,
          description: task.description,
          status: 'incoming',
          priority: task.priority || 'medium',
          due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
          source: 'gmail',
          ai_extracted: true,
          confidence_score: task.confidence,
          extraction_metadata: task.extractedContext || null,
          source_reference: {
            email_id: messageData.id,
            thread_id: messageData.threadId,
            snippet: messageData.snippet,
            original_url: `https://mail.google.com/mail/u/${gmailUser}/#inbox/${messageData.id}`,
          },
          contact: {
            name: from || 'Unknown',
            email: from,
          },
        };

        const { error: insertError } = await supabase
          .from('tasks')
          .insert(insertPayload);

        if (!insertError) {
          tasksCreated += 1;
        } else {
          tasksSkipped += 1;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        messagesScanned: messages.length,
        tasksCreated,
        tasksSkipped,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[gmail-scan] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
