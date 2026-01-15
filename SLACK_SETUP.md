# Slack Integration Setup Guide

This guide will help you set up Slack integration for AI-powered task extraction.

## Prerequisites

- Slack workspace (you need to be a workspace admin or get admin approval)
- Slack account with access to channels

## Step-by-Step Setup

### 1. Create Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Name it "Task Manager AI" (or your preferred name)
5. Select your workspace
6. Click "Create App"

### 2. Configure Bot Token Scopes

1. In your app settings, go to **OAuth & Permissions**
2. Scroll down to **Scopes** → **Bot Token Scopes**
3. Add the following scopes:
   - `channels:history` - View messages in public channels
   - `channels:read` - View basic channel information
   - `groups:history` - View messages in private channels
   - `im:history` - View messages in direct messages
   - `users:read` - View people in the workspace
   - `chat:write` - (Optional) Send messages as the bot

### 3. Install App to Workspace

1. Scroll up to **OAuth Tokens for Your Workspace**
2. Click "Install to Workspace"
3. Review permissions and click "Allow"
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 4. Add Bot to Channels

The bot needs to be added to channels before it can read messages:

1. In Slack, go to any channel you want to scan
2. Type `/invite @Task Manager AI` (or your bot name)
3. The bot will join the channel

**Tip**: For private channels, you must add the bot manually. The bot cannot see channels it hasn't been added to.

### 5. Configure Your App

Add to your `.env` file:

```bash
# Slack Configuration
VITE_SLACK_BOT_TOKEN=xoxb-your-bot-token-here
VITE_SLACK_CLIENT_ID=your_client_id (optional)
VITE_SLACK_CLIENT_SECRET=your_client_secret (optional)
```

The Bot Token is all you need for MVP. Client ID and Secret are for OAuth flow (future feature).

### 6. Test Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the AI Agents panel
3. Click "Scan Slack" (once Phase 2 is deployed)
4. The bot will scan recent messages from channels it's a member of

## What Gets Scanned

### By Default:
- ✅ Public channels the bot is a member of
- ✅ Private channels the bot has been invited to
- ❌ Direct messages (opt-in only)
- ❌ Channels the bot hasn't joined

### Timeframe:
- Last 7 days by default
- Configurable in the scan options

### Message Filtering:
- Only user messages (not bot messages)
- Skips system messages and join/leave notifications
- Processes up to 100 messages per scan (configurable)

## Privacy & Permissions

### What the Bot Can Do:
- ✅ Read messages in channels it's been added to
- ✅ View user names and profiles
- ✅ Access message history (last 7 days by default)

### What the Bot Cannot Do:
- ❌ Cannot read channels it hasn't been invited to
- ❌ Cannot read DMs unless explicitly enabled
- ❌ Cannot see deleted messages
- ❌ Cannot access messages older than the workspace's retention policy

### Data Privacy:
- Only task-relevant text is stored (max 200 chars)
- Full message content is not stored
- Processing happens on-demand (not continuous monitoring)
- AI processing is done via Gemini/Anthropic with your API keys

## Rate Limits

Slack API has rate limits:
- **Tier 1**: 1 request per minute (not used)
- **Tier 2**: 20 requests per minute (used for most operations)
- **Tier 3**: 50+ requests per minute (for approved apps)

For 100 messages from 5 channels:
- Channel info: 5 requests
- Message history: 5 requests  
- User info: ~20-50 requests (cached)
- Total: ~30-60 requests (~2-3 minutes)

**Tip**: The app handles rate limiting automatically with retries and backoff.

## Troubleshooting

### Error: "not_in_channel"
**Solution**: Invite the bot to the channel: `/invite @Task Manager AI`

### Error: "missing_scope"
**Solution**: Go back to OAuth & Permissions and verify all required scopes are added. Then reinstall the app.

### Error: "invalid_auth"
**Solution**: Verify your Bot Token is correct in `.env` and starts with `xoxb-`

### Bot can't see messages
**Solution**:
1. Make sure bot is a member of the channel
2. Check that the bot has the required scopes
3. Verify the bot was installed after adding scopes

### Too slow
**Solution**:
- Reduce `maxMessages` (default 100)
- Select specific channels instead of scanning all
- The first scan is slower due to user info lookups (results are cached)

## Advanced Configuration

### Select Specific Channels

In the AI Agents panel, you can choose which channels to scan:
1. Click "Configure" on the Slack agent
2. Select channels from the list
3. Click "Scan Selected Channels"

### Include Direct Messages

DMs are opt-in for privacy:
1. Enable "Include DMs" in scan options
2. The bot will scan direct messages you've had with it
3. Only DMs where the bot is a participant are accessible

### Adjust Scan Frequency

For production, you can set up scheduled scans:
- Every hour (recommended for active teams)
- Every 4 hours (good for most use cases)
- Daily (for low-volume teams)

## Security Notes

### Development (Testing Mode)
- Install only to your workspace
- Test with a small set of channels first
- Review extracted tasks for accuracy

### Production
- Consider workspace-wide approval policies
- Add bot to channels on a need-to-know basis
- Monitor agent runs in the dashboard
- Set up alerts for failed scans

## Next Steps

After Slack is configured:
1. Test message scanning with "Scan Slack" button
2. Review extracted tasks in the "Incoming" column
3. Adjust AI prompts if needed (in aiExtractionService.ts)
4. Set up scheduled scans for automation
5. Move on to LinkedIn (Phase 3) or Google Meet (Phase 4)

## Support

If you encounter issues:
1. Check Slack App logs in the Slack API dashboard
2. Verify bot token in `.env`
3. Check browser console for error messages
4. Review Slack API documentation: https://api.slack.com/


