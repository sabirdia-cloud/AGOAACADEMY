-- Football Academy System ULTRA 2026 - Master Database Fix
-- 1. Run this in Supabase SQL Editor
-- 2. IMPORTANT: In Supabase Dashboard, go to "Storage" -> "New Bucket"
--    and create a bucket named "photos" and make it "Public".

-- 1. Categories Table (CRITICAL REPAIR)
DO $$ 
BEGIN
  -- If table exists but has 'id' instead of 'category_id', rename it
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'id') THEN
    ALTER TABLE categories RENAME COLUMN id TO category_id;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS categories (
  category_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all necessary columns exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS age_group TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#059669';

-- 2. Teams Table (Repair Primary Key)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'id') THEN
    ALTER TABLE teams RENAME COLUMN id TO team_id;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS teams (
  team_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_id BIGINT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS players_count INTEGER DEFAULT 0;

-- 3. Players Table (Add missing columns)
ALTER TABLE players ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS parent_username TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS parent_password TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- 4. Enable RLS and Create Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for categories" ON categories;
CREATE POLICY "Allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- 5. Add default categories
INSERT INTO categories (name, age_group, color)
SELECT 'U13', '12-13 سنة', '#10b981'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'U13');

INSERT INTO categories (name, age_group, color)
SELECT 'U15', '14-15 سنة', '#3b82f6'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'U15');

INSERT INTO categories (name, age_group, color)
SELECT 'U17', '16-17 سنة', '#f59e0b'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'U17');

INSERT INTO categories (name, age_group, color)
SELECT 'U19', '18-19 سنة', '#f43f5e'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'U19');
