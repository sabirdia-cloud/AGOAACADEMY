-- =============================================
-- ADD NOTIFICATION SETTINGS TO ACADEMY_SETTINGS
-- Run this in Supabase SQL Editor
-- =============================================

ALTER TABLE public.academy_settings 
ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notification_phone TEXT,
ADD COLUMN IF NOT EXISTS admin_notification_email TEXT,
ADD COLUMN IF NOT EXISTS emailjs_service_id TEXT,
ADD COLUMN IF NOT EXISTS emailjs_template_id TEXT,
ADD COLUMN IF NOT EXISTS emailjs_public_key TEXT;

-- Update the default row
UPDATE public.academy_settings 
SET notify_whatsapp = FALSE, notify_email = FALSE 
WHERE id = 1;
