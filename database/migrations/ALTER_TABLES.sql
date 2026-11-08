-- =========================================================================================
-- ULTRA 2026 - UPDATE MISSING COLUMNS
-- This script safely ADDS missing columns to tables if they exist already.
-- =========================================================================================

-- 1. stock_outputs columns
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_outputs' AND column_name = 'receipt_number') THEN
        ALTER TABLE public.stock_outputs ADD COLUMN receipt_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_outputs' AND column_name = 'items') THEN
        ALTER TABLE public.stock_outputs ADD COLUMN items JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_outputs' AND column_name = 'product_name') THEN
        ALTER TABLE public.stock_outputs ADD COLUMN product_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_outputs' AND column_name = 'beneficiary') THEN
        ALTER TABLE public.stock_outputs ADD COLUMN beneficiary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_outputs' AND column_name = 'output_date') THEN
        ALTER TABLE public.stock_outputs ADD COLUMN output_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_outputs' AND column_name = 'notes') THEN
        ALTER TABLE public.stock_outputs ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 2. payments columns
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'notes') THEN
        ALTER TABLE public.payments ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'subscription_id') THEN
        -- HERE is the fix! It references subscriptions(id) instead of subscriptions(subscription_id)
        ALTER TABLE public.payments ADD COLUMN subscription_id BIGINT REFERENCES public.subscriptions(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'player_id') THEN
        ALTER TABLE public.payments ADD COLUMN player_id BIGINT REFERENCES public.players(player_id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. stock_entries columns
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_entries' AND column_name = 'receipt_number') THEN
        ALTER TABLE public.stock_entries ADD COLUMN receipt_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_entries' AND column_name = 'entry_date') THEN
        ALTER TABLE public.stock_entries ADD COLUMN entry_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_entries' AND column_name = 'items') THEN
        ALTER TABLE public.stock_entries ADD COLUMN items JSONB DEFAULT '[]';
    END IF;
END $$;

-- 4. Reload Schema cache
NOTIFY pgrst, 'reload schema';
