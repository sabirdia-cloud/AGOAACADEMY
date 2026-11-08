-- =============================================
-- حل نهائي: حذف جميع الـ Triggers المكسورة
-- قم بنسخ هذا الكود ووضعه في Supabase SQL Editor ثم اضغط Run
-- =============================================

-- حذف جميع الـ triggers على جدول players
DROP TRIGGER IF EXISTS tr_generate_qr ON public.players;
DROP TRIGGER IF EXISTS tr_notify_goal ON public.ems_match_events;
DROP TRIGGER IF EXISTS tr_notify_absence ON public.attendance;
DROP TRIGGER IF EXISTS tr_notify_new_player ON public.players;
DROP TRIGGER IF EXISTS tr_player_qr ON public.players;

-- حذف الـ trigger functions المكسورة
DROP FUNCTION IF EXISTS fn_generate_player_qr() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_goal() CASCADE;
DROP FUNCTION IF EXISTS fn_notify_absence() CASCADE;

-- إعادة إنشاء دالة QR آمنة فقط 
CREATE OR REPLACE FUNCTION fn_generate_player_qr()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL AND NEW.player_id IS NOT NULL THEN
    NEW.qr_code := LPAD(NEW.player_id::text, 5, '0') || 
                   COALESCE(replace(NEW.birth_date::text, '-', ''), '00000000');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_qr ON public.players;
CREATE TRIGGER tr_generate_qr
AFTER INSERT ON public.players
FOR EACH ROW
EXECUTE FUNCTION fn_generate_player_qr();

-- تحديث schema cache
NOTIFY pgrst, 'reload schema';
