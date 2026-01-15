# AI Task Extraction - Setup Guide

This guide will help you configure the AI-powered task extraction features.

## Environment Variables Required

Create a `.env` file in the root directory with the following variables:

### 1. Google Gemini AI (Primary AI Provider)

You have two options: **Google AI Studio** (quick start) or **VertexAI** (production).

#### Option A: Google AI Studio (Easiest - for MVP/Testing)

```bash
VITE_GOOGLE_AI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
```

**How to get this:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key for Gemini
3. Copy the key

**Pros:** Simple, works immediately, no GCP project needed
**Cons:** Rate limits, not for production at scale

#### Option B: VertexAI (Production - Your Setup)

```bash
VITE_GOOGLE_CLOUD_PROJECT_ID=crumbl
VITE_GOOGLE_CLOUD_LOCATION=us-central1
VITE_VERTEX_AI_ENABLED=true
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
```

**How to set up:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your "Crumbl" project
3. Enable the Vertex AI API
4. For browser apps: Create API credentials
5. For Edge Functions: Use Application Default Credentials

**Pros:** Better rate limits, enterprise features, more models
**Cons:** Requires GCP project, more complex auth

**⚠️ Important for VertexAI:**
VertexAI authentication typically requires server-side credentials. For security, AI calls should be made from **Supabase Edge Functions** where you can use service account keys or ADC (Application Default Credentials).

### 2. Gmail API (for Email Task Extraction)

```bash
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_API_KEY=your_google_api_key
```

**How to get these:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Gmail API
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized JavaScript origins: `http://localhost:5173`
5. Add authorized redirect URIs: `http://localhost:5173/auth/callback`

### 3. Anthropic Claude (Optional Fallback)

```bash
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**How to get this:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key

### 4. Slack Integration (Phase 2)

```bash
VITE_SLACK_CLIENT_ID=your_slack_client_id
VITE_SLACK_CLIENT_SECRET=your_slack_client_secret
VITE_SLACK_BOT_TOKEN=your_slack_bot_token
```

**How to get these:**
1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. Add Bot Token Scopes: `channels:history`, `channels:read`, `groups:history`, `im:history`, `users:read`
4. Install app to workspace

## Quick Start for MVP

**Minimum required for Gmail task extraction:**
- `VITE_GOOGLE_AI_API_KEY` (from Google AI Studio)
- `VITE_GOOGLE_CLIENT_ID` (from Google Cloud Console with Gmail API enabled)

## Testing Configuration

After setting up your `.env` file, the AI Agents panel in the app will show which services are configured and ready to use.

## Cost Estimation

- **Gemini API**: ~$2-5 per month per user (100 emails/day)
- **Gmail API**: Free (very generous limits)
- **Anthropic Claude**: ~$3-10 per month if used as primary (more expensive)

## Security Notes

- Never commit `.env` file to git (already in `.gitignore`)
- OAuth tokens are stored securely in Supabase
- AI processing happens on-demand, not continuously
- Only task-relevant snippets are stored (max 200 chars)

