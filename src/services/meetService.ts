/**
 * Google Meet Service
 * Handles Google Meet transcript processing
 */

export interface MeetingTranscript {
  title: string;
  date: Date;
  participants: string[];
  transcript: string;
  duration?: number;
  meetingUrl?: string;
}

export interface ParsedTranscript {
  speakers: Map<string, string[]>; // speaker name -> their statements
  actionItems: string[];
  decisions: string[];
  questions: string[];
}

/**
 * Parse transcript text into structured format
 * Handles both Google Meet format and plain text
 */
export function parseTranscript(transcriptText: string): ParsedTranscript {
  const speakers = new Map<string, string[]>();
  const actionItems: string[] = [];
  const decisions: string[] = [];
  const questions: string[] = [];

  // Try to parse Google Meet format (Name: Statement)
  const lines = transcriptText.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for speaker format: "Name: Statement"
    const speakerMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
    
    if (speakerMatch) {
      const [, speaker, statement] = speakerMatch;
      const speakerName = speaker.trim();
      const statementText = statement.trim();
      
      if (!speakers.has(speakerName)) {
        speakers.set(speakerName, []);
      }
      speakers.get(speakerName)!.push(statementText);

      // Detect action items
      const actionKeywords = [
        /\b(will|shall|should|need to|have to|must)\s+\w+/i,
        /\b(action item|to-?do|task):/i,
        /\b(please|can you|could you)\s+\w+/i,
        /\b(follow up|reach out|send|email|call)\b/i,
      ];
      
      if (actionKeywords.some(regex => regex.test(statementText))) {
        actionItems.push(`${speakerName}: ${statementText}`);
      }

      // Detect decisions
      const decisionKeywords = [
        /\b(decided|agreed|decided to|let's go with)\b/i,
        /\b(final decision|consensus)\b/i,
      ];
      
      if (decisionKeywords.some(regex => regex.test(statementText))) {
        decisions.push(`${speakerName}: ${statementText}`);
      }

      // Detect questions
      if (statementText.includes('?')) {
        questions.push(`${speakerName}: ${statementText}`);
      }
    } else {
      // Plain text without speaker attribution
      if (actionItems.length === 0 && speakers.size === 0) {
        // If we haven't found any structured content, add to "Unknown" speaker
        if (!speakers.has('Unknown')) {
          speakers.set('Unknown', []);
        }
        speakers.get('Unknown')!.push(trimmed);
      }
    }
  }

  return {
    speakers,
    actionItems,
    decisions,
    questions,
  };
}

/**
 * Format transcript for display
 */
export function formatTranscriptSummary(parsed: ParsedTranscript): string {
  let summary = '';

  if (parsed.speakers.size > 0) {
    summary += '**Participants:**\n';
    parsed.speakers.forEach((statements, speaker) => {
      summary += `- ${speaker} (${statements.length} statements)\n`;
    });
    summary += '\n';
  }

  if (parsed.actionItems.length > 0) {
    summary += '**Action Items:**\n';
    parsed.actionItems.forEach(item => {
      summary += `- ${item}\n`;
    });
    summary += '\n';
  }

  if (parsed.decisions.length > 0) {
    summary += '**Decisions:**\n';
    parsed.decisions.forEach(decision => {
      summary += `- ${decision}\n`;
    });
    summary += '\n';
  }

  if (parsed.questions.length > 0) {
    summary += '**Questions:**\n';
    parsed.questions.forEach(question => {
      summary += `- ${question}\n`;
    });
  }

  return summary;
}

/**
 * Extract participants from transcript
 */
export function extractParticipants(transcriptText: string): string[] {
  const parsed = parseTranscript(transcriptText);
  return Array.from(parsed.speakers.keys()).filter(name => name !== 'Unknown');
}

/**
 * Validate transcript format
 */
export function isValidTranscript(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  
  // Very lenient - just check if there's some content
  const trimmed = text.trim();
  return trimmed.length >= 10; // At least 10 characters
}

/**
 * Clean transcript text
 * Removes timestamps, formatting artifacts, etc.
 */
export function cleanTranscript(text: string): string {
  return text
    // Remove timestamps like [00:01:23]
    .replace(/\[\d{2}:\d{2}:\d{2}\]/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove multiple newlines
    .replace(/\n\s*\n/g, '\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * Parse Google Drive file URL to get file ID
 */
export function parseGoogleDriveUrl(url: string): string | null {
  // Format: https://docs.google.com/document/d/FILE_ID/edit
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

