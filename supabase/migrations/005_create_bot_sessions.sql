-- Migration: Create Bot Sessions and Transcripts
-- Description: Schema for "Headless Bot" architecture
-- Date: 2025-12-13

-- Create bot_sessions table
CREATE TABLE IF NOT EXISTS bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_url TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('zoom', 'teams', 'google_meet', 'simulation')),
  status TEXT CHECK (status IN ('provisioning', 'connected', 'disconnected', 'completed', 'failed')) DEFAULT 'provisioning',
  agent_name TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bot_transcripts table (for audit/playback)
CREATE TABLE IF NOT EXISTS bot_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES bot_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  speaker TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_processed BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bot_sessions_user_id ON bot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_status ON bot_sessions(status);
CREATE INDEX IF NOT EXISTS idx_bot_transcripts_session_id ON bot_transcripts(session_id);

-- Enable RLS
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bot_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_sessions' AND policyname = 'Users can view their own sessions') THEN
    CREATE POLICY "Users can view their own sessions" ON bot_sessions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_sessions' AND policyname = 'Users can insert their own sessions') THEN
    CREATE POLICY "Users can insert their own sessions" ON bot_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_sessions' AND policyname = 'Users can update their own sessions') THEN
    CREATE POLICY "Users can update their own sessions" ON bot_sessions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- RLS Policies for bot_transcripts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_transcripts' AND policyname = 'Users can view their own transcripts') THEN
    CREATE POLICY "Users can view their own transcripts" ON bot_transcripts FOR SELECT USING (
      session_id IN (SELECT id FROM bot_sessions WHERE user_id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bot_transcripts' AND policyname = 'Users can insert transcripts for their sessions') THEN
    CREATE POLICY "Users can insert transcripts for their sessions" ON bot_transcripts FOR INSERT WITH CHECK (
      session_id IN (SELECT id FROM bot_sessions WHERE user_id = auth.uid())
    );
  END IF;
END
$$;

-- Realtime subscriptions (so UI updates when bot connects/speaks)
ALTER PUBLICATION supabase_realtime ADD TABLE bot_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE bot_transcripts;
