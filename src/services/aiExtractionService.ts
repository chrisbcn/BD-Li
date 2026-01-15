/**
 * AI Extraction Service
 * Uses Gemini (primary) or Claude (fallback) to extract tasks from text
 * 
 * NOTE: In production, AI API calls should be made from Supabase Edge Functions
 * to keep API keys secure. This is a client-side placeholder for MVP.
 */

import { aiConfig, getAvailableAIProvider } from '../config/ai';
import { Task } from '../types/Task';

// Dynamic imports to avoid bundling Node.js packages
let GoogleGenerativeAI: any;
let Anthropic: any;

// Try to load packages dynamically
try {
  import('@google/generative-ai').then(module => {
    GoogleGenerativeAI = module.GoogleGenerativeAI;
  }).catch(() => {
    console.warn('Google Generative AI not available in browser');
  });
} catch (e) {
  console.warn('Google Generative AI not available');
}

try {
  import('@anthropic-ai/sdk').then(module => {
    Anthropic = module.default;
  }).catch(() => {
    console.warn('Anthropic SDK not available in browser');
  });
} catch (e) {
  console.warn('Anthropic SDK not available');
}

export interface ExtractedTask {
  title: string;
  description: string;
  dueDate?: string; // ISO date string
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  extractedContext?: {
    participants?: string[];
    project?: string;
    deadline?: string;
    tags?: string[];
  };
}

export interface ExtractionResult {
  tasks: ExtractedTask[];
  provider: 'gemini' | 'anthropic';
  rawResponse?: string;
  error?: string;
}

export interface ExtractionSource {
  type: 'gmail' | 'slack' | 'linkedin' | 'google_meet' | 'manual';
  content: string;
  metadata?: {
    from?: string;
    subject?: string;
    date?: string;
    participants?: string[];
    url?: string;
  };
}

/**
 * Generate prompt for task extraction
 */
function generateExtractionPrompt(source: ExtractionSource): string {
  const basePrompt = `You are an expert task extraction AI. Analyze the following communication and extract ALL actionable tasks or commitments.

For each task, provide:
1. A clear, actionable title (start with a verb when possible)
2. Detailed description with context
3. Suggested due date (if mentioned, in ISO 8601 format)
4. Priority: high, medium, or low
5. Confidence score (0-100) based on how certain you are this is a genuine task

Guidelines:
- Only extract genuine action items that require follow-up
- Ignore greetings, sign-offs, and pleasantries
- Include tasks for both the sender and recipient
- For meetings, extract action items discussed
- Assign higher confidence (80+) to explicit tasks ("please do X", "I will Y")
- Assign medium confidence (60-79) to implied tasks
- Assign low confidence (40-59) to potential tasks that might need clarification
- Don't extract tasks with confidence below 40

Return ONLY a valid JSON array of tasks, no other text. Format:
[
  {
    "title": "Review proposal document",
    "description": "Review the Q4 proposal that John sent and provide feedback by Friday",
    "dueDate": "2025-12-13",
    "priority": "high",
    "confidence": 85,
    "extractedContext": {
      "participants": ["John"],
      "project": "Q4 Proposal",
      "deadline": "Friday",
      "tags": ["review", "proposal"]
    }
  }
]

Communication type: ${source.type}
${source.metadata?.from ? `From: ${source.metadata.from}` : ''}
${source.metadata?.subject ? `Subject: ${source.metadata.subject}` : ''}
${source.metadata?.date ? `Date: ${source.metadata.date}` : ''}
${source.metadata?.participants ? `Participants: ${source.metadata.participants.join(', ')}` : ''}

Content:
${source.content}

Extract tasks as JSON array:`;

  return basePrompt;
}

/**
 * Extract tasks using VertexAI via Supabase Edge Function
 * This is the proper production approach - keeps credentials server-side
 */
export async function extractTasksWithGemini(
  source: ExtractionSource
): Promise<ExtractionResult> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    // Call Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/extract-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        content: source.content,
        source: {
          type: source.type,
          metadata: source.metadata,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return {
        tasks: [],
        provider: 'gemini',
        error: data.error || 'Extraction failed',
      };
    }

    return {
      tasks: data.tasks || [],
      provider: 'gemini',
      rawResponse: JSON.stringify(data),
    };
  } catch (error) {
    console.error('VertexAI extraction error:', error);
    return {
      tasks: [],
      provider: 'gemini',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract tasks using Claude (Anthropic)
 */
export async function extractTasksWithClaude(
  source: ExtractionSource
): Promise<ExtractionResult> {
  try {
    if (!Anthropic) {
      return {
        tasks: [],
        provider: 'anthropic',
        error: 'Anthropic API not available in browser - use Supabase Edge Function for production',
      };
    }

    if (!aiConfig.anthropic.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const anthropic = new Anthropic({
      apiKey: aiConfig.anthropic.apiKey,
    });

    const prompt = generateExtractionPrompt(source);

    const message = await anthropic.messages.create({
      model: aiConfig.anthropic.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return {
        tasks: [],
        provider: 'anthropic',
        error: 'No valid JSON array found in response',
        rawResponse: text,
      };
    }

    const tasks: ExtractedTask[] = JSON.parse(jsonMatch[0]);

    // Filter tasks by confidence threshold
    const filteredTasks = tasks.filter(task => task.confidence >= 40);

    return {
      tasks: filteredTasks,
      provider: 'anthropic',
      rawResponse: text,
    };
  } catch (error) {
    console.error('Claude extraction error:', error);
    return {
      tasks: [],
      provider: 'anthropic',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract tasks using the best available AI provider
 */
export async function extractTasks(
  source: ExtractionSource
): Promise<ExtractionResult> {
  const provider = getAvailableAIProvider();

  if (!provider) {
    return {
      tasks: [],
      provider: 'gemini',
      error: 'No AI provider configured. Please set up Gemini or Anthropic API keys.',
    };
  }

  if (provider === 'gemini') {
    const result = await extractTasksWithGemini(source);
    // If Gemini fails and Claude is available, try Claude as fallback
    if (result.error && aiConfig.anthropic.apiKey) {
      console.log('Gemini failed, trying Claude as fallback...');
      return await extractTasksWithClaude(source);
    }
    return result;
  }

  return await extractTasksWithClaude(source);
}

/**
 * Calculate similarity between two strings (0-100)
 * Used for deduplication
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Deduplicate tasks against existing tasks
 * Returns tasks that are not duplicates
 */
export function deduplicateTasks(
  newTasks: ExtractedTask[],
  existingTasks: Task[]
): ExtractedTask[] {
  const SIMILARITY_THRESHOLD = 85; // 85% similarity = duplicate

  return newTasks.filter(newTask => {
    const isDuplicate = existingTasks.some(existingTask => {
      const titleSimilarity = stringSimilarity(
        newTask.title.toLowerCase(),
        existingTask.title.toLowerCase()
      );
      return titleSimilarity >= SIMILARITY_THRESHOLD;
    });
    return !isDuplicate;
  });
}

/**
 * Calculate confidence adjustment based on context
 * Adjusts AI confidence based on additional factors
 */
export function calculateConfidence(
  extractedTask: ExtractedTask,
  context: {
    hasDeadline?: boolean;
    hasPriority?: boolean;
    explicitAction?: boolean;
    fromKnownContact?: boolean;
  }
): number {
  let confidence = extractedTask.confidence;

  // Boost confidence if explicit deadline mentioned
  if (context.hasDeadline) {
    confidence = Math.min(100, confidence + 5);
  }

  // Boost if from known contact
  if (context.fromKnownContact) {
    confidence = Math.min(100, confidence + 5);
  }

  // Boost if explicit action words present
  if (context.explicitAction) {
    confidence = Math.min(100, confidence + 10);
  }

  return Math.round(confidence);
}

/**
 * Batch extract tasks from multiple sources
 */
export async function batchExtractTasks(
  sources: ExtractionSource[]
): Promise<{
  results: ExtractionResult[];
  totalTasks: number;
  errors: number;
}> {
  const results: ExtractionResult[] = [];
  let totalTasks = 0;
  let errors = 0;

  for (const source of sources) {
    try {
      const result = await extractTasks(source);
      results.push(result);
      totalTasks += result.tasks.length;
      if (result.error) {
        errors++;
      }
    } catch (error) {
      console.error('Batch extraction error:', error);
      errors++;
      results.push({
        tasks: [],
        provider: 'gemini',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results, totalTasks, errors };
}

