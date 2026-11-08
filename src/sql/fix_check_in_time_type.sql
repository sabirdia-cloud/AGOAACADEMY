-- Fix check_in_time column type to be 'time' instead of 'timestamp with time zone'
-- First, we check if the column exists and what type it is, but for simplicity in this script:
-- We will alter the column type to 'time' using a USING clause to cast existing data if any.

DO $$
BEGIN
    -- Check if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'check_in_time') THEN
        -- Alter column type to time without time zone
        -- We use ::text::time to handle potential timestamp to time conversion
        ALTER TABLE public.attendance 
        ALTER COLUMN check_in_time TYPE time without time zone 
        USING check_in_time::text::time without time zone;
    END IF;
END $$;
