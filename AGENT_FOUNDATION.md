# Agent Foundation - Implementation Guide

## What's Been Created

### 1. Email Agent (`src/agents/emailAgent.ts`)
- **Purpose**: Extract tasks from emails and create them in the CRM
- **Functions**:
  - `parseEmailForTasks()` - Parse email content to extract actionable tasks
  - `findOrCreateContact()` - Find or create contact from email sender
  - `processEmail()` - Main entry point: process single email
  - `processEmails()` - Batch process multiple emails

**Current Status**: Foundation ready, needs Gemini API integration for intelligent parsing

**Next Steps**:
- Connect to Gmail API
- Replace simple pattern matching with Gemini API calls
- Add webhook support for real-time email processing

### 2. LinkedIn Agent (`src/agents/linkedinAgent.ts`)
- **Purpose**: Track LinkedIn connections and suggest who to reconnect with
- **Functions**:
  - `syncLinkedInConnection()` - Sync LinkedIn connection to CRM contact
  - `getReconnectionSuggestions()` - Get contacts that need reconnection
  - `createReconnectionTasks()` - Create tasks for suggested reconnections
  - `syncLinkedInConnections()` - Batch sync all connections
  - `trackLinkedInInteraction()` - Track LinkedIn interactions

**Current Status**: Foundation ready, needs LinkedIn API integration

**Next Steps**:
- Connect to LinkedIn API (or use scraping with permission)
- Implement mutual connections discovery
- Add scheduled job for periodic syncing

### 3. Agent Index (`src/agents/index.ts`)
- Exports all agent functions
- Provides `getAgentStatus()` for monitoring agent health

## How to Use

### Email Agent Example

```typescript
import { processEmail } from './agents/emailAgent';

const email = {
  id: 'email-123',
  from: { name: 'John Doe', email: 'john@example.com' },
  subject: 'Follow up on proposal',
  body: 'Can you please review the proposal and get back to me by Friday?',
  date: new Date(),
};

const result = await processEmail(email);
// Creates:
// - Task in "ai_captured" status
// - Contact (if new)
// - Activity record
```

### LinkedIn Agent Example

```typescript
import { syncLinkedInConnections, getReconnectionSuggestions } from './agents/linkedinAgent';

// Sync connections
const connections = [
  {
    id: 'linkedin-123',
    name: 'Jane Smith',
    headline: 'CEO at Acme Corp',
    company: 'Acme Corp',
    profileUrl: 'https://linkedin.com/in/janesmith',
  },
];

const { contacts, tasks } = await syncLinkedInConnections(connections);

// Get reconnection suggestions
const suggestions = await getReconnectionSuggestions();
// Returns contacts sorted by priority who need reconnection
```

## Integration Points

### API Routes (Future)
Create API routes to trigger agents:
- `POST /api/agents/email/process` - Process incoming email
- `POST /api/agents/linkedin/sync` - Sync LinkedIn connections
- `GET /api/agents/linkedin/suggestions` - Get reconnection suggestions

### Scheduled Jobs (Future)
Set up cron jobs for:
- Daily email processing
- Weekly LinkedIn sync
- Daily relationship scoring updates

### Webhooks (Future)
- Gmail push notifications
- LinkedIn webhooks (if available)

## Next Steps

1. **Run Migration**: Apply `002_create_contacts_and_activities.sql` to your Supabase database
2. **Test Contacts UI**: Navigate to Contacts section and add some contacts
3. **Integrate Gemini API**: Replace pattern matching with AI-powered parsing
4. **Connect Gmail API**: Set up OAuth and webhook for email processing
5. **Connect LinkedIn API**: Set up LinkedIn integration (or scraping)

## Architecture

```
Email → Email Agent → Parse with Gemini → Extract Tasks → 
  → Find/Create Contact → Create Task → Create Activity

LinkedIn → LinkedIn Agent → Sync Connections → 
  → Calculate Relationship Strength → 
  → Get Suggestions → Create Reconnection Tasks
```

