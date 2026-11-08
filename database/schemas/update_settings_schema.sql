-- =========================================================================================
-- UPDATE ACADEMY SETTINGS SCHEMA
-- Run this in Supabase SQL Editor to add missing security and configuration columns.
-- =========================================================================================

-- 1. Add missing columns to academy_settings
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS admin_username TEXT DEFAULT 'admin';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT 'admin123';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS current_season TEXT DEFAULT '2025/2026';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'DZD';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS print_color TEXT DEFAULT 'color';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS print_size TEXT DEFAULT 'A4';

-- 2. Ensure row with ID 1 exists (essential for update operations)
INSERT INTO public.academy_settings (id, name, admin_username, admin_password)
VALUES (1, 'أكاديمية أجيال وادي العثمانية', 'admin', 'admin123')
ON CONFLICT (id) DO NOTHING;

-- 3. Update existing columns just in case
UPDATE public.academy_settings SET updated_at = NOW() WHERE id = 1;

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
