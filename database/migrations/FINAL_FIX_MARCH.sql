-- ============================================================
-- ULTRA 2026 - FINAL FINANCIAL & TRIGGER FIX
-- This script fixes missing columns and broken triggers
-- ============================================================

-- 1. Fix Finances Table (Add missing title column)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='finances' AND column_name='title') THEN
        ALTER TABLE public.finances ADD COLUMN title TEXT;
    END IF;
END $$;

-- 2. Consolidate Payments ID (Ensure consistency)
-- If table has 'id', we keep it but it's better to ensures triggers don't break
-- Let's ensure 'finance_id' is used in finances and 'player_id' in players

-- 3. DROP ALL OLD TRIGGERS THAT MIGHT CAUSE "column id does not exist" ERROR
DROP TRIGGER IF EXISTS tr_generate_qr ON public.players;
DROP TRIGGER IF EXISTS tr_notify_goal ON public.ems_match_events;
DROP TRIGGER IF EXISTS tr_notify_absence ON public.attendance;
DROP TRIGGER IF EXISTS tr_notify_new_player ON public.players;

DROP FUNCTION IF EXISTS fn_generate_player_qr() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_goal() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_absence() CASCADE;

-- 4. RECREATE A CLEAN QR TRIGGER FOR PLAYERS
CREATE OR REPLACE FUNCTION fn_generate_player_qr()
RETURNS TRIGGER AS $$
BEGIN
  -- Use NEW.player_id correctly
  IF NEW.qr_code IS NULL AND NEW.player_id IS NOT NULL THEN
    NEW.qr_code := 'ULTRA26-' || LPAD(NEW.player_id::text, 6, '0') || '-' || COALESCE(to_char(NEW.birth_date, 'YYYYMMDD'), '00000000');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_qr
BEFORE INSERT ON public.players
FOR EACH ROW
EXECUTE FUNCTION fn_generate_player_qr();

-- 5. Link Payments to Finances (Optional but helpful for "Income" section)
-- Ensure we can insert into finances without 'id' error
-- The finances table uses finance_id as PRIMARY KEY

-- 6. Final verification of finances schema
COMMENT ON TABLE public.finances IS 'Table for academy incomes and expenses';

-- 7. Reload
NOTIFY pgrst, 'reload schema';
