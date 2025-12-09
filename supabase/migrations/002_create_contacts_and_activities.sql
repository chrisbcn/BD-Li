-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  notes TEXT,
  
  -- Relationship tracking
  last_contact_date TIMESTAMPTZ,
  communication_frequency_days INTEGER, -- Average days between communications
  relationship_strength INTEGER DEFAULT 0, -- 0-100 score
  mutual_connections TEXT[], -- Array of contact IDs who are mutual connections
  
  -- Metadata
  source TEXT DEFAULT 'manual', -- manual, gmail, linkedin, etc.
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create activities table for communication history
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Activity details
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'linkedin', 'note', 'task', 'other')),
  subject TEXT,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Source tracking
  source_id TEXT, -- Email ID, LinkedIn message ID, etc.
  source_url TEXT, -- Link to original email, LinkedIn message, etc.
  
  -- Agent tracking
  created_by_agent BOOLEAN DEFAULT false,
  agent_name TEXT, -- Name of agent that created this (e.g., 'email_parser', 'linkedin_agent')
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contact_task junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS contact_tasks (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, task_id)
);

-- Add contact_id to tasks table (for direct relationship)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact ON contacts(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship_strength ON contacts(relationship_strength DESC);

CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_task_id ON activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);

-- Updated_at triggers
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for now, can restrict later)
CREATE POLICY "Allow public read access to contacts" ON contacts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to contacts" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to contacts" ON contacts
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to contacts" ON contacts
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to activities" ON activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to activities" ON activities
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to activities" ON activities
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to contact_tasks" ON contact_tasks
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to contact_tasks" ON contact_tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access to contact_tasks" ON contact_tasks
  FOR DELETE USING (true);

