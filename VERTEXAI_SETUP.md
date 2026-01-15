# VertexAI Setup Guide for "Crumbl" Project

Since you have a Google Cloud Project with VertexAI enabled, here's how to properly configure it for production use.

## Overview

VertexAI is Google's enterprise AI platform. It offers:
- Better rate limits than Google AI Studio
- More model options
- Enterprise support
- Integration with GCP services

## Prerequisites

- Google Cloud Project: **Crumbl** ✅
- VertexAI API enabled ✅
- Billing enabled on project

## Setup for Different Environments

### 1. Development (Quick Test with API Key)

For testing in development, you can use an API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select "Crumbl" project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Restrict the key:
   - **API restrictions**: Select "Vertex AI API"
   - **Application restrictions**: HTTP referrers (for browser)
   - Add `http://localhost:*` and your domain

6. Add to `.env`:
```bash
VITE_GOOGLE_CLOUD_PROJECT_ID=crumbl
VITE_GOOGLE_CLOUD_LOCATION=us-central1
VITE_GOOGLE_AI_API_KEY=your_api_key_here
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
```

**Note:** This works for testing but is not recommended for production.

### 2. Production (Supabase Edge Functions)

For production, move AI calls to backend:

#### Step 1: Create Service Account

1. In Google Cloud Console, go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `task-manager-ai`
4. Grant roles:
   - **Vertex AI User**
   - **Vertex AI Service Agent**
5. Click **Done**
6. Click on the service account → **Keys** tab
7. **Add Key** → **Create New Key** → **JSON**
8. Download the JSON key file

#### Step 2: Store Credentials in Supabase

1. Go to your Supabase project
2. Navigate to **Settings** → **Secrets**
3. Add a new secret:
   - Name: `GOOGLE_APPLICATION_CREDENTIALS`
   - Value: Paste the entire contents of the JSON key file

#### Step 3: Create Supabase Edge Function

Create `supabase/functions/extract-tasks/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { VertexAI } from '@google-cloud/vertexai';

const projectId = 'crumbl';
const location = 'us-central1';
const model = 'gemini-2.0-flash-exp';

serve(async (req) => {
  try {
    const { text, source } = await req.json();
    
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
      // Credentials are automatically loaded from env
    });
    
    const generativeModel = vertexAI.getGenerativeModel({
      model: model,
    });
    
    const prompt = `Extract actionable tasks from this ${source} message:\n\n${text}`;
    
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    
    return new Response(
      JSON.stringify({ 
        tasks: JSON.parse(response.text()),
        success: true 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Step 4: Deploy Edge Function

```bash
supabase functions deploy extract-tasks
```

#### Step 5: Call from Frontend

```typescript
// src/services/aiExtractionService.ts
export async function extractTasks(source: ExtractionSource) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      text: source.content,
      source: source.type,
    }),
  });
  
  return await response.json();
}
```

## Current Configuration

For your "Crumbl" project, here's the recommended setup:

### Development (.env file):
```bash
VITE_GOOGLE_CLOUD_PROJECT_ID=crumbl
VITE_GOOGLE_CLOUD_LOCATION=us-central1
VITE_GOOGLE_AI_API_KEY=your_api_key_here
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
```

### Production (Supabase Secrets):
```bash
GOOGLE_APPLICATION_CREDENTIALS={...service account json...}
GOOGLE_CLOUD_PROJECT=crumbl
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash-exp
```

## Model Options in VertexAI

Available Gemini models in VertexAI:

- `gemini-2.0-flash-exp` - Latest, fastest (recommended)
- `gemini-1.5-flash` - Stable, fast, cost-effective
- `gemini-1.5-pro` - More capable, higher cost
- `gemini-1.0-pro` - Legacy, not recommended

## Pricing

VertexAI Gemini pricing (as of Dec 2024):

**Gemini 2.0 Flash:**
- Input: $0.00001 per 1K characters
- Output: $0.00004 per 1K characters

**Example calculation (100 emails/day):**
- Input: 200K chars/day × $0.00001 = $0.002/day
- Output: 50K chars/day × $0.00004 = $0.002/day
- **Monthly: ~$0.12/user** (much cheaper at scale!)

## Rate Limits

VertexAI has generous limits:
- **Requests per minute**: 300 (vs 60 for AI Studio)
- **Tokens per minute**: 4,000,000
- **Requests per day**: Unlimited with billing

## Benefits of Using VertexAI

1. **Better Performance**: Lower latency, higher throughput
2. **Enterprise Features**: SLA, support, audit logs
3. **Integration**: Works with other GCP services
4. **Scalability**: Handle production traffic
5. **Security**: VPC, private endpoints, IAM controls

## Migration Path

### Current (MVP):
- Frontend calls Google AI Studio API directly
- API key in `.env`
- Good for testing

### Recommended (Production):
- Frontend calls Supabase Edge Function
- Edge Function calls VertexAI
- Service account credentials in Supabase Secrets
- Secure, scalable, enterprise-ready

## Troubleshooting

### Error: "PERMISSION_DENIED"
**Solution**: Make sure Vertex AI API is enabled and service account has correct roles

### Error: "RESOURCE_EXHAUSTED"
**Solution**: Check quota limits in GCP Console, request increase if needed

### Error: "INVALID_ARGUMENT: model not found"
**Solution**: Verify model name is correct, some models need allowlist access

## Next Steps

1. **Quick Start**: Use API key in `.env` for testing
2. **When Ready for Production**: 
   - Create service account
   - Set up Edge Functions
   - Move AI calls to backend
3. **Monitor Usage**: Check GCP Console for usage and costs

Your "Crumbl" project is ready! Just need to add the credentials to your `.env` file.


