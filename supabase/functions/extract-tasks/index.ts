/**
 * Supabase Edge Function: extract-tasks
 * 
 * Uses VertexAI (Gemini) to extract tasks from communication text
 * This runs server-side to keep API credentials secure
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@4.15.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedTask {
  title: string;
  description: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  extractedContext?: {
    participants?: string[];
    project?: string;
    deadline?: string;
    tags?: string[];
  };
}

interface ExtractionRequest {
  content: string;
  source: {
    type: 'gmail' | 'slack' | 'linkedin' | 'google_meet' | 'manual';
    metadata?: {
      from?: string;
      subject?: string;
      date?: string;
      participants?: string[];
      url?: string;
    };
  };
}

/**
 * Get Google Cloud Access Token using Service Account
 */
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const algorithm = 'RS256';
    const privateKey = await importPKCS8(serviceAccount.private_key, algorithm);

    const jwt = await new SignJWT({
      scope: 'https://www.googleapis.com/auth/cloud-platform'
    })
      .setProtectedHeader({ alg: algorithm })
      .setIssuer(serviceAccount.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(privateKey);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('Failed to authenticate with Google Cloud Service Account');
  }
}

/**
 * Generate extraction prompt
 */
function generatePrompt(content: string, sourceType: string, metadata?: any): string {
  return `You are an expert task extraction AI. Analyze the following communication and extract ALL actionable tasks or commitments.

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

Communication type: ${sourceType}
${metadata?.from ? `From: ${metadata.from}` : ''}
${metadata?.subject ? `Subject: ${metadata.subject}` : ''}
${metadata?.date ? `Date: ${metadata.date}` : ''}
${metadata?.participants ? `Participants: ${metadata.participants.join(', ')}` : ''}

Content:
${content}

Extract tasks as JSON array:`;
}

/**
 * Call VertexAI Gemini API
 */
async function callVertexAI(prompt: string): Promise<ExtractedTask[]> {
  const projectId = Deno.env.get('VERTEX_PROJECT_ID'); // Still needed for URL
  const location = Deno.env.get('VERTEX_LOCATION') || 'us-central1';
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');

  if (!projectId) {
    throw new Error('VERTEX_PROJECT_ID not configured');
  }

  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT not configured');
  }

  // Get fresh access token
  const accessToken = await getAccessToken(serviceAccountJson);

  // Use specific model version
  const model = 'gemini-2.0-flash-lite-001';
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`VertexAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Extract text from response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('No JSON array found in response:', text);
    return [];
  }

  const tasks: ExtractedTask[] = JSON.parse(jsonMatch[0]);

  // Filter by confidence threshold
  return tasks.filter(task => task.confidence >= 40);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { content, source }: ExtractionRequest = await req.json();

    if (!content || !source) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: content, source' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate prompt
    const prompt = generatePrompt(content, source.type, source.metadata);

    // Call VertexAI
    const tasks = await callVertexAI(prompt);

    return new Response(
      JSON.stringify({
        success: true,
        tasks,
        provider: 'vertexai',
        count: tasks.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-tasks function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tasks: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

