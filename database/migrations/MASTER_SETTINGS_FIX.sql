-- =========================================================================================
-- MASTER SETTINGS REPAIR - ULTRA 2026
-- Run this in Supabase SQL Editor to fix "Failed to save settings" error.
-- =========================================================================================

-- 1. Ensure Table Exists with primary columns
CREATE TABLE IF NOT EXISTS public.academy_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    name TEXT DEFAULT 'أكاديمية وداد عثمانية'
);

-- 2. Add ALL missing columns used in the UI
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS public_url TEXT;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS current_season TEXT DEFAULT '2025/2026';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'DZD';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS print_logo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS print_qr BOOLEAN DEFAULT TRUE;
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS print_color TEXT DEFAULT 'color';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS print_size TEXT DEFAULT 'A4';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS admin_username TEXT DEFAULT 'admin';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT 'admin123';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ensure a default row exists so 'UPDATE' works correctly
INSERT INTO public.academy_settings (id, name, admin_username, admin_password)
VALUES (1, 'أكاديمية أجيال وادي العثمانية', 'admin', 'admin123')
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security (RLS) and allow EVERYTHING
ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All" ON public.academy_settings;
CREATE POLICY "Allow All" ON public.academy_settings FOR ALL USING (true) WITH CHECK (true);

-- 5. Reload Schema
NOTIFY pgrst, 'reload schema';
