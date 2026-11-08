-- Update evaluations table for advanced player rating system
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS pace INTEGER DEFAULT 50;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS shooting INTEGER DEFAULT 50;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS passing INTEGER DEFAULT 50;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS dribbling INTEGER DEFAULT 50;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS defending INTEGER DEFAULT 50;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS physical_status INTEGER DEFAULT 50;

-- Update RLS if needed (already enabled usually)
-- These columns are part of the existing evaluations table.
