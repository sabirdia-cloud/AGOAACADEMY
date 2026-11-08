-- Fix the column type for check_in_time to be TIME instead of TIMESTAMPTZ
-- This will convert any existing timestamp data to just the time part
ALTER TABLE public.attendance 
ALTER COLUMN check_in_time TYPE time without time zone 
USING check_in_time::text::time without time zone;
