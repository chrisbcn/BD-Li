# Gmail OAuth Setup Guide

This guide walks you through setting up Gmail OAuth for task extraction.

## Prerequisites

- Google Cloud Project (or create a new one)
- Google Account with access to Gmail

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Task Manager" (or your preferred name)
4. Click "Create"

### 2. Enable Gmail API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on it and press "Enable"

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Click "Create"

#### Fill in App Information:
- **App name**: Task Manager AI
- **User support email**: Your email
- **App logo**: (optional)
- **Application home page**: `http://localhost:5173` (for development)
- **Authorized domains**: Leave empty for development
- **Developer contact information**: Your email

4. Click "Save and Continue"

#### Scopes:
5. Click "Add or Remove Scopes"
6. Filter for "Gmail API"
7. Select: `https://www.googleapis.com/auth/gmail.readonly`
8. Click "Update" and "Save and Continue"

#### Test Users (for development):
9. Click "Add Users"
10. Add your Gmail address
11. Click "Save and Continue"

### 4. Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Choose **Web application**

#### Configure:
- **Name**: Task Manager Web Client
- **Authorized JavaScript origins**:
  - `http://localhost:5173`
  - `http://localhost:5174`
  - Add your production domain later
- **Authorized redirect URIs**:
  - `http://localhost:5173/auth/callback`
  - `http://localhost:5174/auth/callback`
  - Add your production callback URL later

4. Click "Create"
5. **Copy your Client ID** (you'll need this for `.env`)

### 5. Get API Key (Optional, for quota monitoring)

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "API key"
3. Copy the API key
4. Click "Restrict Key"
5. Under "API restrictions", select "Restrict key"
6. Choose "Gmail API"
7. Click "Save"

### 6. Configure Your App

Create or update `.env` file in your project root:

```bash
# Gmail OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_api_key_here

# If using VertexAI (same Google Cloud project)
VITE_GOOGLE_CLOUD_PROJECT_ID=your_project_id
```

### 7. Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the AI Agents panel
3. Click "Connect Gmail"
4. Sign in with your Google account
5. Grant permissions to read emails
6. You should see "Connected" status

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Solution**: Make sure the redirect URI in your OAuth configuration exactly matches `http://localhost:5173/auth/callback`
- Check for trailing slashes or http vs https mismatches

### Error: "Access blocked: This app's request is invalid"
- **Solution**: Make sure you added your email as a test user in the OAuth consent screen

### Error: "The app is not verified"
- **Solution**: For development, click "Advanced" → "Go to [App Name] (unsafe)"
- For production, you'll need to submit your app for verification

### Can't see recent emails
- **Solution**: 
  - Make sure you granted the `gmail.readonly` scope
  - Check that you're signed in with the correct Google account
  - Verify the Gmail API is enabled in your project

## Security Notes

### Development
- OAuth consent screen is in "Testing" mode
- Only test users can authenticate
- Perfect for development and personal use

### Production
- Submit app for verification by Google
- Update authorized domains and redirect URIs
- Add proper privacy policy and terms of service
- Consider using Supabase Edge Functions for server-side OAuth

## Rate Limits

Gmail API has generous quotas:
- **250 quota units per user per second**
- **1 billion quota units per day** (free)

Each operation has a cost:
- List messages: 5 units
- Get message: 5 units
- Modify message: 5 units

For 100 emails scanned per day:
- List: 5 units
- Get each email: 500 units (100 × 5)
- Total: ~505 units per scan (well within limits)

## Next Steps

After Gmail OAuth is configured:
1. Test email scanning with "Scan Gmail" button
2. Verify tasks are being extracted correctly
3. Adjust AI prompts if needed
4. Set up other integrations (Slack, LinkedIn, Meet)

## Support

If you encounter issues:
1. Check Google Cloud Console for API errors
2. Verify all credentials in `.env`
3. Check browser console for error messages
4. Review Gmail API documentation: https://developers.google.com/gmail/api


