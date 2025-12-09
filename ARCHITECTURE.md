# CRM Architecture - Foundation for Agentic Components

## Overview

This is a CRM system built on a task management foundation. The system is designed to:
1. Track tasks linked to contacts and deals
2. Maintain relationship history through activities
3. Enable agentic components to extract tasks from email and LinkedIn
4. Suggest who to reconnect with based on relationship tracking

## Database Schema

### Core Tables

1. **tasks** - Task management (already exists)
   - Links to contacts via `contact_id`
   - Can be created from email, LinkedIn, manual entry, etc.

2. **contacts** - People in your network
   - Tracks: name, email, phone, company, LinkedIn URL
   - Relationship metrics: last_contact_date, communication_frequency_days, relationship_strength
   - Mutual connections tracking

3. **activities** - Communication history
   - Types: email, call, meeting, linkedin, note, task, other
   - Links to contacts and tasks
   - Tracks source (email ID, LinkedIn message ID, etc.)
   - Agent attribution (which agent created this)

4. **contact_tasks** - Many-to-many relationship between contacts and tasks

## Agentic Components Architecture

### 1. Email Task Extraction Agent

**Purpose**: Parse emails and extract actionable tasks

**Flow**:
1. Monitor Gmail inbox (via Google Workspace API)
2. Parse email content for action items
3. Extract:
   - Task title and description
   - Due date (if mentioned)
   - Contact information (sender)
   - Priority (based on keywords, sender importance)
4. Create task in "ai_captured" status
5. Link to existing contact or create new contact
6. Create activity record for the email

**Implementation**:
- Use Gmail API to fetch emails
- Use Gemini API to parse and extract tasks
- Store email ID in `source_reference.email_id`
- Create activity with type "email"

### 2. LinkedIn Relationship Agent

**Purpose**: Track LinkedIn connections and suggest who to reconnect with

**Flow**:
1. Connect to LinkedIn API (or scrape with permission)
2. For each connection:
   - Check if contact exists in CRM
   - If not, create contact with LinkedIn data
   - Update mutual connections
3. Analyze communication history:
   - Calculate days since last contact
   - Compare to communication frequency
   - Calculate relationship strength
4. Suggest contacts to reconnect with:
   - Contacts with low relationship strength
   - Contacts we haven't contacted in a while
   - High-value contacts (based on company, role, etc.)
5. Create tasks for suggested reconnections

**Implementation**:
- Use `getContactsToReconnect()` function
- Create tasks with type "linkedin" and source "linkedin"
- Update `last_contact_date` when LinkedIn interaction occurs
- Track mutual connections in `mutual_connections` array

### 3. Relationship Scoring Agent

**Purpose**: Automatically calculate and update relationship strength

**Factors**:
- Days since last contact
- Communication frequency
- Number of interactions
- Mutual connections
- Company/role importance
- Recent activity volume

**Implementation**:
- Run periodically (daily/weekly)
- Update `relationship_strength` for all contacts
- Create tasks for contacts that need attention
- Update `communication_frequency_days` based on history

## Data Flow

### Task Creation from Email
```
Email → Email Agent → Parse with Gemini → Extract Task → 
  → Check/Create Contact → Create Task → Create Activity
```

### LinkedIn Reconnection Suggestion
```
LinkedIn API → Get Connections → Check CRM → 
  → Calculate Relationship Strength → 
  → Filter Low-Strength Contacts → Create Tasks
```

### Activity Logging
```
Any Interaction → Create Activity → 
  → Update Contact.last_contact_date → 
  → Recalculate relationship_strength
```

## Next Steps

1. ✅ Create database schema for Contacts and Activities
2. ✅ Create TypeScript types and service layers
3. ⏳ Build Contacts UI section
4. ⏳ Add Activities timeline to Contact/Task views
5. ⏳ Create agent foundation (API routes, Gemini integration)
6. ⏳ Build email parsing agent
7. ⏳ Build LinkedIn relationship agent
8. ⏳ Add relationship scoring dashboard

## API Endpoints Needed (Future)

- `/api/agents/email/parse` - Parse email and extract tasks
- `/api/agents/linkedin/sync` - Sync LinkedIn connections
- `/api/agents/linkedin/suggest` - Get reconnection suggestions
- `/api/agents/relationship/score` - Recalculate relationship scores

