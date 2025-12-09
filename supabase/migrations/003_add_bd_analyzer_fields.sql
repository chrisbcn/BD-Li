-- Add BD Analyzer fields to support lead scoring and response tracking

-- Add response tracking fields to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_outbound BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_time_hours INTEGER;

-- Add lead scoring fields to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2);

-- Create index for lead score queries
CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON contacts(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_temperature ON contacts(temperature);

-- Create index for outbound activities (for response tracking)
CREATE INDEX IF NOT EXISTS idx_activities_outbound ON activities(is_outbound) WHERE is_outbound = true;
CREATE INDEX IF NOT EXISTS idx_activities_response ON activities(response_received) WHERE response_received = true;

