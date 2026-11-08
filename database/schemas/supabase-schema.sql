-- Supabase SQL Schema for Academy Manager

-- 1. Parents Table
CREATE TABLE IF NOT EXISTS parents (
  parent_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  relation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS teams (
  team_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_name TEXT NOT NULL,
  category TEXT,
  coach_id BIGINT,
  players_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coaches Table
CREATE TABLE IF NOT EXISTS coaches (
  coach_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license TEXT,
  team_id BIGINT REFERENCES teams(team_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Players Table
CREATE TABLE IF NOT EXISTS players (
  player_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  birth_date DATE,
  age INTEGER,
  position TEXT,
  height TEXT,
  weight TEXT,
  preferred_foot TEXT,
  team_id BIGINT REFERENCES teams(team_id),
  parent_id BIGINT REFERENCES parents(parent_id),
  phone TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trainings Table
CREATE TABLE IF NOT EXISTS trainings (
  training_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_id BIGINT NOT NULL REFERENCES teams(team_id),
  coach_id BIGINT REFERENCES coaches(coach_id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  training_id BIGINT NOT NULL REFERENCES trainings(training_id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- حاضر, غائب, بعذر, متأخر
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  match_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_id BIGINT NOT NULL REFERENCES teams(team_id),
  opponent TEXT NOT NULL,
  match_date DATE NOT NULL,
  time TIME NOT NULL DEFAULT '00:00',
  location TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'ودية', -- ودية, رسمية, بطولة
  score TEXT DEFAULT '- - -',
  status TEXT DEFAULT 'قادمة', -- قادمة, جارية, منتهية, ملغاة
  result TEXT DEFAULT 'لم تلعب بعد', -- لم تلعب بعد, فوز, تعادل, خسارة
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Player Stats Table
CREATE TABLE IF NOT EXISTS player_stats (
  stat_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_id BIGINT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  passes INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'نشط', -- نشط, منتهي, معلق
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  subscription_id BIGINT NOT NULL REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL, -- نقداً, تحويل بنكي, بطاقة ائتمان, أخرى
  status TEXT DEFAULT 'مكتمل', -- مكتمل, معلق, فاشل
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Injuries Table
CREATE TABLE IF NOT EXISTS injuries (
  injury_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  injury_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- خفيفة, متوسطة, شديدة
  date_occurred DATE NOT NULL,
  expected_recovery DATE,
  status TEXT DEFAULT 'قيد العلاج', -- قيد العلاج, تعافي جزئي, جاهز
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
  evaluation_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
  coach_id BIGINT REFERENCES coaches(coach_id),
  date DATE NOT NULL,
  technical INTEGER DEFAULT 0,
  tactical INTEGER DEFAULT 0,
  physical INTEGER DEFAULT 0,
  mental INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
