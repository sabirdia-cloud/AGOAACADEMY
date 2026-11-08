-- ============================================================
-- Supabase FIX Script (Clean Version)
-- تشغيل هذا في SQL Editor في Supabase
-- ============================================================

-- 1. إضافة الأعمدة الناقصة في جدول players
ALTER TABLE players ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS parent_username TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS parent_password TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS wilaya TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS commune TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS nid TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- 2. إضافة الأعمدة الناقصة في جدول parents
ALTER TABLE parents ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS password TEXT;

-- 3. إضافة الأعمدة الناقصة في جدول attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_time TIME;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. إضافة الأعمدة الناقصة في جدول coaches
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS salary DECIMAL;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'نشط';

-- 5. جدول الحصص التدريبية (training)
CREATE TABLE IF NOT EXISTS training (
  training_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_id BIGINT REFERENCES teams(team_id) ON DELETE SET NULL,
  coach_id BIGINT REFERENCES coaches(coach_id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training ADD COLUMN IF NOT EXISTS team_id BIGINT;
ALTER TABLE training ADD COLUMN IF NOT EXISTS coach_id BIGINT;
ALTER TABLE training ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE training ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE training ADD COLUMN IF NOT EXISTS location TEXT;

-- 6. جدول رسائل الأولياء واللاعبين
CREATE TABLE IF NOT EXISTS parent_messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  parent_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جدول الربط بين الأولياء واللاعبين
CREATE TABLE IF NOT EXISTS parent_players (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  parent_id BIGINT NOT NULL REFERENCES parents(parent_id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, player_id)
);

-- تفعيل RLS (Row Level Security)
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE training ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_messages ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت لتجنب التكرار
DROP POLICY IF EXISTS allow_all_parents ON parents;
DROP POLICY IF EXISTS allow_all_players ON players;
DROP POLICY IF EXISTS allow_all_attendance ON attendance;
DROP POLICY IF EXISTS allow_all_training ON training;
DROP POLICY IF EXISTS allow_all_parent_messages ON parent_messages;
DROP POLICY IF EXISTS allow_all_player_messages ON player_messages;

-- إنشاء سياسات مفتوحة للتطوير
CREATE POLICY allow_all_parents ON parents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_players ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_attendance ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_training ON training FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_parent_messages ON parent_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_player_messages ON player_messages FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- إضافة الجداول المتقدمة (Kits, Finances, Stock, EMS Matches, Settings)
-- ============================================================

-- 1. جدول الألبسة والأطقم الرياضية (kits)
CREATE TABLE IF NOT EXISTS kits (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
  items TEXT,
  distributed_at DATE,
  status TEXT DEFAULT 'delivered',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جداول المخزون (Stock)
CREATE TABLE IF NOT EXISTS stock_entries (
  entry_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  receipt_number TEXT,
  product_name TEXT,
  category TEXT,
  quantity INTEGER,
  unit_price DECIMAL,
  total_price DECIMAL,
  purchase_date DATE,
  entry_date DATE,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_outputs (
  output_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  receipt_number TEXT,
  product_name TEXT,
  category TEXT,
  quantity INTEGER,
  beneficiary TEXT,
  output_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. الميزانية والمالية (Finances)
CREATE TABLE IF NOT EXISTS finances (
  finance_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type TEXT NOT NULL,          -- 'income' or 'expense'
  category TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إعدادات الأكاديمية (Academy Settings)
CREATE TABLE IF NOT EXISTS academy_settings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج إعدادات افتراضية
INSERT INTO academy_settings (name, phone, address) 
SELECT 'أكاديمية كرة القدم', '0000000000', 'الجزائر'
WHERE NOT EXISTS (SELECT 1 FROM academy_settings LIMIT 1);

-- 5. جداول مركز المباريات المتقدم (EMS)
CREATE TABLE IF NOT EXISTS ems_matches (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  home_team TEXT,
  away_team TEXT,
  competition TEXT,
  category TEXT,
  match_date DATE,
  time TIME,
  stadium TEXT,
  coach_name TEXT,
  assistant_coach TEXT,
  score TEXT,
  result TEXT,
  match_type TEXT,
  status TEXT DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ems_match_players (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT REFERENCES ems_matches(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
  jersey_number INTEGER,
  position TEXT,
  is_starting BOOLEAN DEFAULT FALSE,
  is_substitute BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ems_match_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT REFERENCES ems_matches(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  minute INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems_match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE ems_match_events ENABLE ROW LEVEL SECURITY;

-- سياسات الجداول الجديدة
DROP POLICY IF EXISTS allow_all_kits ON kits;
DROP POLICY IF EXISTS allow_all_stock_ent ON stock_entries;
DROP POLICY IF EXISTS allow_all_stock_out ON stock_outputs;
DROP POLICY IF EXISTS allow_all_finances ON finances;
DROP POLICY IF EXISTS allow_all_settings ON academy_settings;
DROP POLICY IF EXISTS allow_all_ems_matches ON ems_matches;
DROP POLICY IF EXISTS allow_all_ems_players ON ems_match_players;
DROP POLICY IF EXISTS allow_all_ems_events ON ems_match_events;

CREATE POLICY allow_all_kits ON kits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_stock_ent ON stock_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_stock_out ON stock_outputs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_finances ON finances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_settings ON academy_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_ems_matches ON ems_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_ems_players ON ems_match_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_ems_events ON ems_match_events FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- إضافة الفئات والاشتراكات
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  category_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  age_group TEXT,
  color TEXT DEFAULT '#059669',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  duration TEXT DEFAULT 'شهر',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_categories ON categories;
DROP POLICY IF EXISTS allow_all_subscription_plans ON subscription_plans;

CREATE POLICY allow_all_categories ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_subscription_plans ON subscription_plans FOR ALL USING (true) WITH CHECK (true);

-- 6. جداول الإحصائيات والاشتراكات (إعادة إنشاء لضمان صحة العلاقات)
DROP TABLE IF EXISTS player_stats CASCADE;
CREATE TABLE player_stats (
  stat_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT REFERENCES ems_matches(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  passes INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS subscriptions CASCADE;
CREATE TABLE subscriptions (
  subscription_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
  plan_name TEXT,
  amount DECIMAL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'نشط',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS لهذه الجداول
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ضمان حذف السياسات القديمة
DROP POLICY IF EXISTS allow_all_stats ON player_stats;
DROP POLICY IF EXISTS allow_all_subs ON subscriptions;

-- إنشاء سياسات بسيطة بدون مسافات في الاسم
CREATE POLICY allow_all_stats ON player_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_subs ON subscriptions FOR ALL USING (true) WITH CHECK (true);
