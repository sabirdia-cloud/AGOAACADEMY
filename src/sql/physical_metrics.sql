CREATE TABLE IF NOT EXISTS public.physical_metrics (
    metric_id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES public.players(player_id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    height DECIMAL,
    weight DECIMAL,
    bmi DECIMAL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.physical_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to physical_metrics" ON public.physical_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public insert to physical_metrics" ON public.physical_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to physical_metrics" ON public.physical_metrics FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to physical_metrics" ON public.physical_metrics FOR DELETE USING (true);
