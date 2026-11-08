CREATE TABLE IF NOT EXISTS public.badges (
    badge_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT, -- Lucide icon name or emoji
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.player_badges (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES public.players(player_id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES public.badges(badge_id) ON DELETE CASCADE,
    awarded_date DATE DEFAULT CURRENT_DATE,
    awarded_by TEXT, -- Admin or Coach name
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default badges
INSERT INTO public.badges (name, icon, description) VALUES
('Man of the Match', 'Trophy', 'أفضل لاعب في المباراة'),
('Most Committed', 'Calendar', 'الأكثر التزاماً بالحضور والتدريبات'),
('Goal Scorer', 'Target', 'هداف الشهر'),
('Star Player', 'Star', 'اللاعب المتميز'),
('Future Talent', 'Zap', 'موهبة صاعدة')
ON CONFLICT DO NOTHING;

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Allow public read access to player_badges" ON public.player_badges FOR SELECT USING (true);
CREATE POLICY "Allow public insert to player_badges" ON public.player_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete from player_badges" ON public.player_badges FOR DELETE USING (true);
