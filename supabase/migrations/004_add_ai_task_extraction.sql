-- Migration: Add AI Task Extraction Support
-- Description: Adds fields to support AI-extracted tasks and agent monitoring
-- Date: 2025-12-09

-- Add AI-related columns to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS ai_extracted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS extraction_metadata JSONB;

-- Add comments for documentation
COMMENT ON COLUMN tasks.ai_extracted IS 'True if task was extracted by AI agent';
COMMENT ON COLUMN tasks.confidence_score IS 'AI confidence score (0-100) for task extraction accuracy';
COMMENT ON COLUMN tasks.extraction_metadata IS 'Additional metadata from AI extraction (participants, context, etc.)';

-- Create agent_runs table for monitoring
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL CHECK (agent_name IN ('gmail', 'slack', 'linkedin', 'google_meet', 'manual_transcript')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')) DEFAULT 'running',
  items_processed INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  tasks_skipped INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_ai_extracted ON tasks(ai_extracted) WHERE ai_extracted = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_confidence_score ON tasks(confidence_score) WHERE confidence_score IS NOT NULL;

-- Add comments
COMMENT ON TABLE agent_runs IS 'Tracks execution history and stats for all AI agents';
COMMENT ON COLUMN agent_runs.agent_name IS 'Name of the agent: gmail, slack, linkedin, google_meet, manual_transcript';
COMMENT ON COLUMN agent_runs.metadata IS 'Agent-specific metadata (channels scanned, email count, etc.)';

-- Create oauth_tokens table for secure token storage
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'slack', 'linkedin', 'google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add index for token lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);

-- Add comments
COMMENT ON TABLE oauth_tokens IS 'Securely stores OAuth tokens for API integrations';
COMMENT ON COLUMN oauth_tokens.provider IS 'OAuth provider: gmail, slack, linkedin, google';

-- Enable Row Level Security
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_runs
CREATE POLICY "Users can view their own agent runs"
  ON agent_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent runs"
  ON agent_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent runs"
  ON agent_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for oauth_tokens
CREATE POLICY "Users can view their own tokens"
  ON oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON oauth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON oauth_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON oauth_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Create helper function to update agent run status
CREATE OR REPLACE FUNCTION update_agent_run_status(
  run_id UUID,
  new_status TEXT,
  items_count INTEGER DEFAULT NULL,
  tasks_count INTEGER DEFAULT NULL,
  skipped_count INTEGER DEFAULT NULL,
  error_msg TEXT DEFAULT NULL
)
RETURNS agent_runs
LANGUAGE plpgsql
AS $$
DECLARE
  updated_run agent_runs;
BEGIN
  UPDATE agent_runs
  SET 
    status = new_status,
    completed_at = CASE WHEN new_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END,
    items_processed = COALESCE(items_count, items_processed),
    tasks_created = COALESCE(tasks_count, tasks_created),
    tasks_skipped = COALESCE(skipped_count, tasks_skipped),
    error_message = COALESCE(error_msg, error_message)
  WHERE id = run_id
  RETURNING * INTO updated_run;
  
  RETURN updated_run;
END;
$$;

COMMENT ON FUNCTION update_agent_run_status IS 'Helper function to update agent run status and stats';


