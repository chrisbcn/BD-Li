-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('incoming', 'ai_captured', 'todo', 'done')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  recurrence_enabled BOOLEAN DEFAULT true,
  recurrence_days INTEGER DEFAULT 7,
  source TEXT DEFAULT 'manual',
  labels TEXT[],
  tags TEXT[],
  assignee TEXT,
  client TEXT,
  deal_id TEXT,
  confidence_score INTEGER,
  source_reference JSONB,
  contact JSONB,
  account_info JSONB,
  next_actions TEXT[],
  recent_activity JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Create index on completed_date for recurrence checks
CREATE INDEX IF NOT EXISTS idx_tasks_completed_date ON tasks(completed_date) WHERE completed_date IS NOT NULL;

-- Create updated_at trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;


-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- For now, we'll allow public access (you can restrict this later)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON tasks FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow public insert access') THEN
    CREATE POLICY "Allow public insert access" ON tasks FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow public update access') THEN
    CREATE POLICY "Allow public update access" ON tasks FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Allow public delete access') THEN
    CREATE POLICY "Allow public delete access" ON tasks FOR DELETE USING (true);
  END IF;
END
$$;


-- Create column_names table for custom column names
CREATE TABLE IF NOT EXISTS column_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Optional: for multi-user support later
  incoming TEXT DEFAULT 'Incoming',
  ai_captured TEXT DEFAULT 'AI Captured',
  todo TEXT DEFAULT 'To-do',
  done TEXT DEFAULT 'Done',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS for column_names
ALTER TABLE column_names ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'column_names' AND policyname = 'Allow public access to column names') THEN
    CREATE POLICY "Allow public access to column names" ON column_names FOR ALL USING (true);
  END IF;
END
$$;


