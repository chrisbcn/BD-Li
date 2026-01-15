# VertexAI Edge Function Setup Guide

## Overview

We've migrated from the client-side Google AI SDK to a proper **Supabase Edge Function** that calls **VertexAI**. This is the secure, production-ready approach.

## Architecture

```
Frontend (Browser)
    ↓
Supabase Edge Function (extract-tasks)
    ↓
Google Cloud VertexAI (Gemini)
```

## Setup Steps

### 1. Get VertexAI Service Account Credentials

You need a **service account** with VertexAI access:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: **Crumbl**
3. Navigate to **IAM & Admin > Service Accounts**
4. Create a new service account or use existing one
5. Grant these roles:
   - `Vertex AI User`
   - `AI Platform User` (legacy, but may be needed)
6. Create a JSON key file for this service account

### 2. Get Access Token

There are two options:

#### Option A: Use Service Account JSON (Recommended for Production)

You'll need to convert the service account key to an access token. The Edge Function will need to do this automatically. Let me know if you want to implement this.

#### Option B: Use gcloud CLI (Quick Testing)

For testing, you can generate a temporary access token:

```bash
gcloud auth application-default login
gcloud auth application-default print-access-token
```

This token expires after 1 hour.

### 3. Configure Supabase Edge Function Secrets

Set environment variables in Supabase:

```bash
# Navigate to your Supabase project
supabase secrets set VERTEX_PROJECT_ID="crumbl-XXXXXX"
supabase secrets set VERTEX_LOCATION="us-central1"
supabase secrets set VERTEX_ACCESS_TOKEN="ya29...." # From step 2
```

Or in Supabase Dashboard:
1. Go to **Project Settings > Edge Functions**
2. Add secrets:
   - `VERTEX_PROJECT_ID`: Your Google Cloud project ID (looks like `crumbl-123456`)
   - `VERTEX_LOCATION`: `us-central1` (or your preferred region)
   - `VERTEX_ACCESS_TOKEN`: Access token from step 2

### 4. Deploy the Edge Function

```bash
# Make sure Supabase CLI is installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy extract-tasks
```

### 5. Enable the Function in Supabase

1. Go to **Edge Functions** in Supabase Dashboard
2. Find `extract-tasks`
3. Make sure it's enabled

### 6. Test the Function

You can test directly:

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/extract-tasks' \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hey, can you please review the Q4 proposal by Friday? Also, schedule a meeting with the team next week.",
    "source": {
      "type": "manual",
      "metadata": {
        "from": "test@example.com"
      }
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "tasks": [
    {
      "title": "Review Q4 proposal",
      "description": "Review the Q4 proposal by Friday",
      "dueDate": "2025-12-13",
      "priority": "high",
      "confidence": 85,
      "extractedContext": {
        "deadline": "Friday",
        "tags": ["review", "proposal"]
      }
    },
    {
      "title": "Schedule team meeting",
      "description": "Schedule a meeting with the team next week",
      "priority": "medium",
      "confidence": 75,
      "extractedContext": {
        "deadline": "next week",
        "tags": ["meeting", "schedule"]
      }
    }
  ],
  "provider": "vertexai",
  "count": 2
}
```

## What Changed in the Code

### Frontend (`src/services/aiExtractionService.ts`)

- Removed direct Google Generative AI SDK calls
- Now calls Supabase Edge Function at `/functions/v1/extract-tasks`
- Passes content and metadata to the function
- Receives structured JSON response

### Backend (`supabase/functions/extract-tasks/index.ts`)

- New Deno-based Edge Function
- Calls VertexAI REST API directly
- Uses proper OAuth2 access tokens (not API keys)
- Keeps credentials secure on server-side

## Benefits of This Approach

1. **Security**: API credentials stay server-side
2. **Scalability**: Supabase Edge Functions auto-scale
3. **Proper Auth**: Uses VertexAI's OAuth2 (not limited API keys)
4. **Access to Latest Models**: VertexAI has `gemini-1.5-flash`, `gemini-1.5-pro`, etc.
5. **Cost Control**: Centralized billing through Google Cloud
6. **Enterprise Features**: Access to VertexAI's enterprise capabilities

## Troubleshooting

### Error: "VertexAI credentials not configured"

- Check that `VERTEX_PROJECT_ID` and `VERTEX_ACCESS_TOKEN` are set in Supabase secrets
- Verify secrets are deployed: `supabase secrets list`

### Error: "Permission denied"

- Ensure service account has `Vertex AI User` role
- Check that VertexAI API is enabled in Google Cloud Console

### Error: "Model not found"

- Verify the model name (e.g., `gemini-1.5-flash`)
- Check that the location matches where model is available

### Access Token Expired

- Access tokens from gcloud expire in 1 hour
- For production, implement automatic token refresh using service account JSON

## Next Steps

1. Deploy the Edge Function
2. Configure secrets
3. Test extraction from the app
4. (Optional) Implement automatic token refresh for production

## Alternative: Service Account with Automatic Token Refresh

If you want the Edge Function to automatically refresh tokens (recommended for production), I can implement that. It requires:
1. Service account JSON key
2. JWT signing library in the Edge Function
3. Token caching logic

Let me know if you want this!

