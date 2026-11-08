DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'subscription_id') THEN
        ALTER TABLE public.payments ADD COLUMN subscription_id BIGINT REFERENCES public.subscriptions(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'player_id') THEN
        ALTER TABLE public.payments ADD COLUMN player_id BIGINT REFERENCES public.players(player_id) ON DELETE SET NULL;
    END IF;
END $$;
NOTIFY pgrst, 'reload schema';
