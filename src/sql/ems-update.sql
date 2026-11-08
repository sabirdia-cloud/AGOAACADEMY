-- إضافة حقول النتيجة والنوع والحالة لجدول المباريات الإلكترونية لدمج الوظائف
ALTER TABLE matches_ems ADD COLUMN IF NOT EXISTS score TEXT DEFAULT '- - -';
ALTER TABLE matches_ems ADD COLUMN IF NOT EXISTS result TEXT DEFAULT 'لم تلعب بعد';
ALTER TABLE matches_ems ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'ودية';
ALTER TABLE matches_ems ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'قادمة';
ALTER TABLE matches_ems ADD COLUMN IF NOT EXISTS time TEXT DEFAULT '00:00';
ALTER TABLE matches_ems ADD COLUMN IF NOT EXISTS notes TEXT;
