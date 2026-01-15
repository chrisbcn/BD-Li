# Migration 004: AI Task Extraction Setup

This migration adds support for AI-powered task extraction from emails, Slack, LinkedIn, and Google Meet.

## What This Migration Adds

### 1. Tasks Table Enhancements
- `ai_extracted`: Boolean flag for AI-created tasks
- `confidence_score`: AI confidence score (0-100)
- `extraction_metadata`: JSON metadata (participants, context, etc.)

### 2. New Tables

#### `agent_runs`
Tracks execution history and statistics for all AI agents:
- Agent name (gmail, slack, linkedin, google_meet)
- Status (running, completed, failed, cancelled)
- Items processed and tasks created counts
- Error messages and metadata

#### `oauth_tokens`
Securely stores OAuth tokens for API integrations:
- Provider (gmail, slack, linkedin, google)
- Access/refresh tokens
- Expiration and scope information

### 3. Security
- Row Level Security (RLS) enabled on all new tables
- Users can only access their own agent runs and tokens
- Helper function for updating agent run status

## How to Apply This Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/004_add_ai_task_extraction.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution
Connect to your PostgreSQL database and run the migration file.

## Verification

After running the migration, verify it worked:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN ('ai_extracted', 'confidence_score', 'extraction_metadata');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('agent_runs', 'oauth_tokens');

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('agent_runs', 'oauth_tokens', 'tasks');
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove new columns from tasks
ALTER TABLE tasks 
  DROP COLUMN IF EXISTS ai_extracted,
  DROP COLUMN IF EXISTS confidence_score,
  DROP COLUMN IF EXISTS extraction_metadata;

-- Drop new tables
DROP TABLE IF EXISTS oauth_tokens CASCADE;
DROP TABLE IF EXISTS agent_runs CASCADE;

-- Drop helper function
DROP FUNCTION IF EXISTS update_agent_run_status CASCADE;
```

## Next Steps

After applying this migration:
1. Configure AI API keys (see AI_SETUP_GUIDE.md)
2. Set up Gmail OAuth
3. Test AI task extraction with the "Scan Gmail" feature


