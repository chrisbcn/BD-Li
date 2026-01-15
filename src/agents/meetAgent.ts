/**
 * Google Meet Agent
 * Processes meeting transcripts and extracts tasks
 */

import { Task, CreateTaskInput } from '../types/Task';
import { Contact } from '../types/Contact';
import { Activity } from '../types/Activity';
import * as taskService from '../services/taskService';
import * as contactService from '../services/contactService';
import * as activityService from '../services/activityService';
import * as meetService from '../services/meetService';
import { extractTasks, deduplicateTasks, ExtractionSource } from '../services/aiExtractionService';
import { supabase } from '../lib/supabase';

export interface ProcessTranscriptOptions {
  meetingTitle: string;
  transcript: string;
  participants?: string[];
  meetingDate?: Date;
  meetingUrl?: string;
}

/**
 * Process meeting transcript and extract tasks
 */
export async function processTranscript(
  options: ProcessTranscriptOptions
): Promise<{
  runId: string;
  tasksCreated: number;
  participantsIdentified: number;
}> {
  const {
    meetingTitle,
    transcript,
    participants: providedParticipants,
    meetingDate,
    meetingUrl,
  } = options;

  // Create agent run record (optional - skip if table doesn't exist)
  let agentRun: any = null;
  try {
    const { data, error: runError } = await supabase
      .from('agent_runs')
      .insert({
        agent_name: 'google_meet',
        status: 'running',
        metadata: {
          meetingTitle,
          transcriptLength: transcript.length,
          participantCount: providedParticipants?.length || 0,
        },
      })
      .select()
      .single();
    
    if (!runError) {
      agentRun = data;
    }
  } catch (error) {
    // Silently continue if agent_runs table doesn't exist yet
    console.log('Agent runs table not found - skipping tracking (run migration 004)');
  }

  try {
    // Clean and validate transcript
    const cleanedTranscript = meetService.cleanTranscript(transcript);
    
    if (!meetService.isValidTranscript(cleanedTranscript)) {
      throw new Error('Invalid transcript format');
    }

    // Parse transcript to extract participants and action items
    const parsed = meetService.parseTranscript(cleanedTranscript);
    
    // Get participants (from provided list or from transcript)
    const participants = providedParticipants && providedParticipants.length > 0
      ? providedParticipants
      : Array.from(parsed.speakers.keys()).filter(name => name !== 'Unknown');

    // Extract tasks using AI
    const source: ExtractionSource = {
      type: 'google_meet',
      content: cleanedTranscript,
      metadata: {
        subject: meetingTitle,
        date: (meetingDate || new Date()).toISOString(),
        participants,
        url: meetingUrl,
      },
    };

    const result = await extractTasks(source);

    if (result.error) {
      throw new Error(result.error);
    }

    // Deduplicate against existing tasks
    const existingTasks = await taskService.fetchTasks();
    const uniqueTasks = deduplicateTasks(result.tasks, existingTasks);

    // Create tasks
    const createdTasks: Task[] = [];
    
    for (const extractedTask of uniqueTasks) {
      // Try to match task to a participant
      let contactId: string | undefined;
      
      // If task mentions a participant name, link it to that contact
      for (const participantName of participants) {
        if (extractedTask.description.toLowerCase().includes(participantName.toLowerCase())) {
          const contacts = await contactService.fetchContacts();
          const contact = contacts.find(c => 
            c.name.toLowerCase() === participantName.toLowerCase()
          );
          
          if (contact) {
            contactId = contact.id;
            break;
          }
        }
      }

      const taskInput: CreateTaskInput = {
        title: extractedTask.title,
        description: extractedTask.description,
        status: 'incoming',
        priority: extractedTask.priority,
        due_date: extractedTask.dueDate ? new Date(extractedTask.dueDate) : null,
        source: 'meet',
        confidence_score: extractedTask.confidence,
        source_reference: {
          snippet: cleanedTranscript.substring(0, 200),
          original_url: meetingUrl,
        },
        tags: ['meeting', ...(extractedTask.extractedContext?.tags || [])],
      };

      // Add contact info if available
      if (contactId) {
        const contact = await contactService.fetchContactById(contactId);
        if (contact) {
          taskInput.contact = {
            name: contact.name,
            email: contact.email,
            company: contact.company,
            avatar: contact.avatar_url,
          };
        }
      }

      const task = await taskService.addTask(taskInput);
      createdTasks.push(task);

      // Create activity record
      if (contactId) {
        await activityService.createActivity({
          contact_id: contactId,
          task_id: task.id,
          type: 'meeting',
          subject: meetingTitle,
          description: `Task extracted from meeting: ${meetingTitle}`,
          date: meetingDate || new Date(),
          created_by_agent: true,
          agent_name: 'meet_agent',
        });
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
            items_processed: 1,
            tasks_created: createdTasks.length,
            metadata: {
              meetingTitle,
              transcriptLength: transcript.length,
              participantCount: participants.length,
              tasksCreated: createdTasks.length,
            },
          })
          .eq('id', agentRun.id);
      } catch (error) {
        console.log('Could not update agent run record');
      }
    }

    return {
      runId: agentRun?.id || 'no-tracking',
      tasksCreated: createdTasks.length,
      participantsIdentified: participants.length,
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

/**
 * Process multiple transcripts in batch
 */
export async function batchProcessTranscripts(
  transcripts: ProcessTranscriptOptions[]
): Promise<{
  totalTasks: number;
  totalParticipants: number;
  errors: number;
}> {
  let totalTasks = 0;
  let totalParticipants = 0;
  let errors = 0;

  for (const transcript of transcripts) {
    try {
      const result = await processTranscript(transcript);
      totalTasks += result.tasksCreated;
      totalParticipants += result.participantsIdentified;
    } catch (error) {
      console.error('Error processing transcript:', error);
      errors++;
    }
  }

  return {
    totalTasks,
    totalParticipants,
    errors,
  };
}

