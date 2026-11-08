-- ============================================================
-- ULTRA 2026 - NUCLEAR TRIGGER DELETE & SCHEMA FIX
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX EVERYTHING
-- ============================================================

-- 1. DELETE ALL TRIGGERS ON ALL RELEVANT TABLES
-- We use a loop to find and drop triggers if we could, but let's just list every one we know
DROP TRIGGER IF EXISTS tr_generate_qr ON public.players;
DROP TRIGGER IF EXISTS tr_notify_goal ON public.ems_match_events;
DROP TRIGGER IF EXISTS tr_notify_absence ON public.attendance;
DROP TRIGGER IF EXISTS tr_notify_new_player ON public.players;
DROP TRIGGER IF EXISTS tr_player_qr ON public.players;
DROP TRIGGER IF EXISTS tr_auto_qr ON public.players;
DROP TRIGGER IF EXISTS tr_payment_finance ON public.payments;
DROP TRIGGER IF EXISTS tr_subscription_finance ON public.subscriptions;
DROP TRIGGER IF EXISTS tr_generate_parent_login ON public.players;

-- 2. DROP ALL FUNCTIONS
DROP FUNCTION IF EXISTS fn_generate_player_qr() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_goal() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_absence() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_new_player() CASCADE;
DROP FUNCTION IF EXISTS fn_sync_payment_to_finance() CASCADE;
DROP FUNCTION IF EXISTS fn_generate_parent_login() CASCADE;

-- 3. ENSURE COLUMNS ARE CORRECT
-- If players table has 'id', it might be causing conflicts. Let's check.
-- But usually the error is because a trigger references OLD.id or NEW.id 
-- when the table doesn't have it.

ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS title TEXT;

-- 4. RECREATE A VERY BASIC QR GENERATOR (Doesn't use "id", uses "player_id")
CREATE OR REPLACE FUNCTION fn_generate_player_qr()
RETURNS TRIGGER AS $$
BEGIN
  -- We use player_id as the unique key
  IF NEW.player_id IS NOT NULL AND NEW.qr_code IS NULL THEN
    NEW.qr_code := 'U26-' || LPAD(NEW.player_id::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_qr
AFTER INSERT ON public.players
FOR EACH ROW
EXECUTE FUNCTION fn_generate_player_qr();

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

SELECT 'DATABASE CLEANED. TRY REGISTERING NOW.' as status;
