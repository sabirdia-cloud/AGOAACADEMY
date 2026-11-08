-- Add salary field to coaches
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS salary_per_session NUMERIC DEFAULT 1000;

-- Optional: Track payments to coaches
CREATE TABLE IF NOT EXISTS public.coach_payments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    coach_id BIGINT REFERENCES coaches(coach_id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    month text NOT NULL, -- Format: YYYY-MM
    sessions_count INTEGER NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coach_payments ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists, then recreate
DROP POLICY IF EXISTS "Allow all for admin coach_payments" ON public.coach_payments;
CREATE POLICY "Allow all for admin coach_payments" ON public.coach_payments FOR ALL USING (true);
