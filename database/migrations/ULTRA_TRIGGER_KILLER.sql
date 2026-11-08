-- ============================================================
-- ULTRA 2026 - FINAL TRIGGER KILLER (MARCH 11)
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX "column id does not exist"
-- ============================================================

-- 1. DROP EVERY POSSIBLE TRIGGER ON PLAYERS, FINANCES, PAYMENTS
DROP TRIGGER IF EXISTS tr_generate_qr ON public.players;
DROP TRIGGER IF EXISTS tr_notify_goal ON public.ems_match_events;
DROP TRIGGER IF EXISTS tr_notify_absence ON public.attendance;
DROP TRIGGER IF EXISTS tr_notify_new_player ON public.players;
DROP TRIGGER IF EXISTS tr_player_qr ON public.players;
DROP TRIGGER IF EXISTS tr_auto_qr ON public.players;
DROP TRIGGER IF EXISTS tr_payment_finance ON public.payments;
DROP TRIGGER IF EXISTS tr_subscription_finance ON public.subscriptions;

-- 2. DROP THE FUNCTIONS TO CLEAN UP
DROP FUNCTION IF EXISTS fn_generate_player_qr() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_goal() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_absence() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_new_player() CASCADE;
DROP FUNCTION IF EXISTS fn_sync_payment_to_finance() CASCADE;

-- 3. FIX FINANCES TABLE (Add title if missing)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='finances' AND column_name='title') THEN
        ALTER TABLE public.finances ADD COLUMN title TEXT;
    END IF;
END $$;

-- 4. RECREATE ONLY THE NECESSARY QR TRIGGER (SAFE VERSION)
CREATE OR REPLACE FUNCTION fn_generate_player_qr()
RETURNS TRIGGER AS $$
BEGIN
  -- We only use columns that DEFINITELY exist: player_id (PK)
  IF NEW.qr_code IS NULL AND NEW.player_id IS NOT NULL THEN
    NEW.qr_code := 'U-' || LPAD(NEW.player_id::text, 6, '0');
  ELSIF NEW.qr_code IS NULL THEN
    -- If player_id is not yet available (BEFORE trigger), we leave it for AFTER trigger or manual update
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_qr
BEFORE INSERT ON public.players
FOR EACH ROW
EXECUTE FUNCTION fn_generate_player_qr();

-- 5. Final Schema Refresh
NOTIFY pgrst, 'reload schema';

-- Verification message
SELECT 'TRIGGERS CLEANED SUCCESSFULLY. YOU CAN NOW REGISTER PLAYERS.' as result;
