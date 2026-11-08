-- 1. Pedagogical Reports (Evaluations)
CREATE TABLE pedagogical_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id),
    session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    technical_level INTEGER CHECK (technical_level BETWEEN 1 AND 10), -- التمرير، التحكم
    tactical_level INTEGER CHECK (tactical_level BETWEEN 1 AND 10), -- التمركز
    physical_level INTEGER CHECK (physical_level BETWEEN 1 AND 10), -- اللياقة
    discipline_level INTEGER CHECK (discipline_level BETWEEN 1 AND 10), -- الانضباط
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Matches & Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('match', 'trip', 'tournament', 'meeting')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    target_categories TEXT[], -- Array of categories like ['U13', 'U15']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Event RSVPs
CREATE TABLE event_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('attending', 'declined', 'tentative')),
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, player_id)
);

-- 4. Match Details & Lineups
CREATE TABLE match_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    opponent_name TEXT,
    match_type TEXT, -- Friendly, Official
    lineup_json JSONB, -- Store formation and player positions
    score_academy INTEGER DEFAULT 0,
    score_opponent INTEGER DEFAULT 0,
    highlights TEXT
);

-- RLS Policies
ALTER TABLE pedagogical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_details ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Public Read Pedagogical" ON pedagogical_reports FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON events FOR SELECT USING (true);
CREATE POLICY "Public Read RSVPs" ON event_responses FOR SELECT USING (true);
CREATE POLICY "Public Read MatchDetails" ON match_details FOR SELECT USING (true);

-- Allow admins/coaches to manage
CREATE POLICY "Coach Manage Pedagogical" ON pedagogical_reports FOR ALL USING (true);
CREATE POLICY "Coach Manage Events" ON events FOR ALL USING (true);
CREATE POLICY "Coach Manage RSVPs" ON event_responses FOR ALL USING (true);
CREATE POLICY "Coach Manage MatchDetails" ON match_details FOR ALL USING (true);
