/**
 * Slack Agent
 * Extracts tasks from Slack messages
 */

import { Task, CreateTaskInput } from '../types/Task';
import { Contact } from '../types/Contact';
import { Activity } from '../types/Activity';
import * as taskService from '../services/taskService';
import * as contactService from '../services/contactService';
import * as activityService from '../services/activityService';
import * as slackService from '../services/slackService';
import { extractTasks, deduplicateTasks, ExtractionSource } from '../services/aiExtractionService';
import { supabase } from '../lib/supabase';

export interface SlackScanOptions {
  channelIds?: string[];
  includeDMs?: boolean;
  maxMessages?: number;
}

/**
 * Find or create contact from Slack user
 */
async function findOrCreateContact(
  userId: string,
  userName: string,
  userEmail?: string
): Promise<Contact> {
  // Try to find existing contact by email or name
  const contacts = await contactService.fetchContacts();
  
  if (userEmail) {
    const existingContact = contacts.find((c) => c.email === userEmail);
    if (existingContact) return existingContact;
  }

  const existingByName = contacts.find((c) => c.name === userName);
  if (existingByName) return existingByName;

  // Create new contact
  const userInfo = await slackService.getUserInfo(userId);
  
  return await contactService.createContact({
    name: userInfo.name,
    email: userInfo.email,
    avatar_url: userInfo.avatar,
    source: 'slack',
  });
}

/**
 * Process Slack message and extract tasks
 */
async function processSlackMessage(
  message: slackService.SlackMessage
): Promise<{
  tasks: Task[];
  contact: Contact;
  activity: Activity;
}> {
  // Extract tasks using AI
  const source: ExtractionSource = {
    type: 'slack',
    content: message.text,
    metadata: {
      from: message.userName || message.user,
      date: new Date(parseFloat(message.timestamp) * 1000).toISOString(),
      participants: [message.userName || message.user],
    },
  };

  const result = await extractTasks(source);

  if (result.error || result.tasks.length === 0) {
    throw new Error(result.error || 'No tasks found in message');
  }

  // Deduplicate against existing tasks
  const existingTasks = await taskService.fetchTasks();
  const uniqueTasks = deduplicateTasks(result.tasks, existingTasks);

  if (uniqueTasks.length === 0) {
    throw new Error('All extracted tasks are duplicates');
  }

  // Find or create contact
  const contact = await findOrCreateContact(
    message.user,
    message.userName || message.user
  );

  // Create tasks
  const createdTasks: Task[] = [];
  for (const extractedTask of uniqueTasks) {
    const taskInput: CreateTaskInput = {
      title: extractedTask.title,
      description: extractedTask.description,
      status: 'incoming',
      priority: extractedTask.priority,
      due_date: extractedTask.dueDate ? new Date(extractedTask.dueDate) : null,
      source: 'manual', // Slack not in TaskSource type yet
      confidence_score: extractedTask.confidence,
      source_reference: {
        snippet: message.text.substring(0, 200),
        original_url: `slack://channel?team=${message.channel}&id=${message.channel}`,
      },
      contact: {
        name: contact.name,
        email: contact.email,
        avatar: contact.url,
      },
    };

    const task = await taskService.addTask(taskInput);
    createdTasks.push(task);
  }

  // Create activity record
  const activity = await activityService.createActivity({
    contact_id: contact.id,
    task_id: createdTasks[0]?.id,
    type: 'other',
    subject: `Slack message in #${message.channelName || 'channel'}`,
    description: `Message: ${message.text.substring(0, 200)}`,
    date: new Date(parseFloat(message.timestamp) * 1000),
    source_id: message.id,
    created_by_agent: true,
    agent_name: 'slack_agent',
  });

  return {
    tasks: createdTasks,
    contact,
    activity,
  };
}

/**
 * Scan Slack for tasks
 * Main entry point for Slack integration
 */
export async function scanSlackForTasks(
  options: SlackScanOptions = {}
): Promise<{
  runId: string;
  tasksCreated: number;
  messagesProcessed: number;
  errors: number;
}> {
  const { channelIds, includeDMs = false, maxMessages = 100 } = options;

  // Create agent run record (optional - skip if table doesn't exist)
  let agentRun: any = null;
  try {
    const { data, error: runError } = await supabase
      .from('agent_runs')
      .insert({
        agent_name: 'slack',
        status: 'running',
        metadata: { channelIds, includeDMs, maxMessages },
      })
      .select()
      .single();
    
    if (!runError) {
      agentRun = data;
    }
  } catch (error) {
    console.log('Agent runs table not found - skipping tracking (run migration 004)');
  }

  try {
    let messages: slackService.SlackMessage[] = [];

    if (channelIds && channelIds.length > 0) {
      // Fetch from specified channels
      messages = await slackService.fetchRecentMessages(channelIds, maxMessages);
    } else {
      // Fetch from all channels user is a member of
      const channels = await slackService.listChannels();
      const memberChannels = channels.filter(c => c.isMember).map(c => c.id);
      
      if (includeDMs) {
        const dms = await slackService.listDMs();
        memberChannels.push(...dms.map(dm => dm.id));
      }

      messages = await slackService.fetchRecentMessages(memberChannels, maxMessages);
    }

    // Process messages
    const allTasks: Task[] = [];
    let errors = 0;

    for (const message of messages) {
      try {
        const result = await processSlackMessage(message);
        allTasks.push(...result.tasks);
      } catch (error) {
        console.error(`Error processing Slack message ${message.id}:`, error);
        errors++;
      }
    }

    // Update agent run record (if it was created)
    if (agentRun?.id) {
      try {
        await supabase
          .from('agent_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            items_processed: messages.length,
            tasks_created: allTasks.length,
            tasks_skipped: messages.length - allTasks.length,
          })
          .eq('id', agentRun.id);
      } catch (error) {
        console.log('Could not update agent run record');
      }
    }

    return {
      runId: agentRun?.id || 'no-tracking',
      tasksCreated: allTasks.length,
      messagesProcessed: messages.length,
      errors,
    };
  } catch (error) {
    // Update agent run with error (if it was created)
    if (agentRun?.id) {
      try {
        await supabase
          .from('agent_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', agentRun.id);
      } catch (updateError) {
        console.log('Could not update agent run record');
      }
    }

    throw error;
  }
}

