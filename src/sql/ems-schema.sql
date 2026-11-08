-- Electronic Match Sheet System (نظام ورقة اللقاء الإلكترونية)
-- This schema adds the necessary tables for professional match management.

-- 1. Matches Table (Electronic Version)
-- We use 'matches_ems' to avoid conflict with existing 'matches' table
CREATE TABLE IF NOT EXISTS matches_ems (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_date DATE NOT NULL,
  competition TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  stadium TEXT NOT NULL,
  category TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  assistant_coach TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Match Players Table
CREATE TABLE IF NOT EXISTS match_players (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT NOT NULL REFERENCES matches_ems(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  jersey_number INTEGER,
  position TEXT,
  is_starting BOOLEAN DEFAULT true,
  is_substitute BOOLEAN DEFAULT false
);

-- 3. Match Events Table
CREATE TABLE IF NOT EXISTS match_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT NOT NULL REFERENCES matches_ems(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- goal, assist, yellow_card, red_card, substitution_in, substitution_out
  minute INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE matches_ems ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- Policies: Admin can do everything, others can only read
CREATE POLICY "Allow all for admin matches_ems" ON matches_ems FOR ALL USING (true);
CREATE POLICY "Allow all for admin match_players" ON match_players FOR ALL USING (true);
CREATE POLICY "Allow all for admin match_events" ON match_events FOR ALL USING (true);
