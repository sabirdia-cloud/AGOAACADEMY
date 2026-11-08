-- ============================================================
-- Football Academy Management System ULTRA 2026
-- Advanced Logic, Views, Triggers, and Dashboards
-- ============================================================

-- 1. Create Notifications Table for Triggers
CREATE TABLE IF NOT EXISTS academy_notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  recipient_role TEXT, -- 'admin', 'coach', 'parent'
  recipient_id BIGINT,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger Function: Notify Goal
CREATE OR REPLACE FUNCTION fn_notify_goal()
RETURNS TRIGGER AS $$
DECLARE
  player_name TEXT;
  parent_id BIGINT;
BEGIN
  SELECT name, p.id INTO player_name, parent_id 
  FROM players pl 
  JOIN parents p ON (pl.parent_username = p.username OR pl.phone = p.phone)
  WHERE pl.player_id = NEW.player_id;

  IF player_name IS NOT NULL THEN
    -- Notify Parent
    INSERT INTO academy_notifications (recipient_role, recipient_id, title, message)
    VALUES ('parent', parent_id, '⚽ هدف جديد!', 'تهانينا! سجل لاعبك ' || player_name || ' هدفاً رائعاً في الدقيقة ' || NEW.minute);
    
    -- Notify Admin
    INSERT INTO academy_notifications (recipient_role, title, message)
    VALUES ('admin', '⚽ هدف مسجل', 'تم تسجيل هدف بواسطة ' || player_name || ' في المباراة رقم ' || NEW.match_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_goal ON ems_match_events;
CREATE TRIGGER tr_notify_goal
AFTER INSERT ON ems_match_events
FOR EACH ROW
WHEN (NEW.event_type = 'goal')
EXECUTE FUNCTION fn_notify_goal();

-- 3. Trigger Function: Notify Absence
CREATE OR REPLACE FUNCTION fn_notify_absence()
RETURNS TRIGGER AS $$
DECLARE
  player_name TEXT;
  parent_id BIGINT;
BEGIN
  IF NEW.status = 'غائب' THEN
    SELECT name, p.id INTO player_name, parent_id 
    FROM players pl 
    JOIN parents p ON (pl.parent_username = p.username OR pl.phone = p.phone)
    WHERE pl.player_id = NEW.player_id;

    IF parent_id IS NOT NULL THEN
      INSERT INTO academy_notifications (recipient_role, recipient_id, title, message)
      VALUES ('parent', parent_id, '⚠️ غياب اللاعب', 'نحيطكم علماً بأن اللاعب ' || player_name || ' غائب عن حصة التدريب بتاريخ ' || CURRENT_DATE);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_absence ON attendance;
CREATE TRIGGER tr_notify_absence
AFTER INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION fn_notify_absence();

-- 4. View: Top Scorers Dashboard
CREATE OR REPLACE VIEW top_scorers_dashboard AS
SELECT 
  p.player_id,
  p.name,
  p.category,
  COUNT(e.id) FILTER (WHERE e.event_type = 'goal') as goals,
  COUNT(e.id) FILTER (WHERE e.event_type = 'assist') as assists,
  p.photo_url
FROM players p
LEFT JOIN ems_match_events e ON p.player_id = e.player_id
GROUP BY p.player_id, p.name, p.category, p.photo_url
ORDER BY goals DESC, assists DESC;

-- 5. View: Season League Table (Calculated from EMS Matches)
CREATE OR REPLACE VIEW season_league_table AS
WITH match_results AS (
  SELECT 
    home_team as team_name,
    category,
    CASE 
      WHEN split_part(score, '-', 1)::int > split_part(score, '-', 2)::int THEN 3
      WHEN split_part(score, '-', 1)::int = split_part(score, '-', 2)::int THEN 1
      ELSE 0
    END as points,
    CASE WHEN split_part(score, '-', 1)::int > split_part(score, '-', 2)::int THEN 1 ELSE 0 END as win,
    CASE WHEN split_part(score, '-', 1)::int = split_part(score, '-', 2)::int THEN 1 ELSE 0 END as draw,
    CASE WHEN split_part(score, '-', 1)::int < split_part(score, '-', 2)::int THEN 1 ELSE 0 END as loss
  FROM ems_matches
  WHERE status = 'منتهية' AND score ~ '^[0-9]+-[0-9]+$'
  
  UNION ALL
  
  SELECT 
    away_team as team_name,
    category,
    CASE 
      WHEN split_part(score, '-', 2)::int > split_part(score, '-', 1)::int THEN 3
      WHEN split_part(score, '-', 1)::int = split_part(score, '-', 2)::int THEN 1
      ELSE 0
    END as points,
    CASE WHEN split_part(score, '-', 2)::int > split_part(score, '-', 1)::int THEN 1 ELSE 0 END as win,
    CASE WHEN split_part(score, '-', 2)::int = split_part(score, '-', 1)::int THEN 1 ELSE 0 END as draw,
    CASE WHEN split_part(score, '-', 2)::int < split_part(score, '-', 1)::int THEN 1 ELSE 0 END as loss
  FROM ems_matches
  WHERE status = 'منتهية' AND score ~ '^[0-9]+-[0-9]+$'
)
SELECT 
  team_name,
  category,
  COUNT(*) as played,
  SUM(win) as won,
  SUM(draw) as drawn,
  SUM(loss) as lost,
  SUM(points) as points
FROM match_results
GROUP BY team_name, category
ORDER BY points DESC, won DESC;

-- 6. View: Player Level (Performance Score 0-100)
CREATE OR REPLACE VIEW player_level AS
SELECT 
  p.player_id,
  p.name,
  p.category,
  ROUND(
    COALESCE(AVG(ps.rating), 70) * 0.4 + -- Performance rating 40%
    COALESCE((SELECT COUNT(*) FROM attendance WHERE player_id = p.player_id AND status = 'حاضر')::float / 
      NULLIF((SELECT COUNT(*) FROM attendance WHERE player_id = p.player_id), 0), 0.8) * 30 + -- Attendance 30%
    LEAST(COUNT(e.id) FILTER (WHERE e.event_type = 'goal'), 10) * 3 -- Goals factor 30%
  ) as level_score
FROM players p
LEFT JOIN player_stats ps ON p.player_id = ps.player_id
LEFT JOIN ems_match_events e ON p.player_id = e.player_id
GROUP BY p.player_id, p.name, p.category;

-- 7. View: Best Rated Players
CREATE OR REPLACE VIEW best_rated_players AS
SELECT 
  p.name,
  p.category,
  ROUND(AVG(ps.rating), 2) as avg_rating,
  COUNT(ps.stat_id) as matches_rated
FROM players p
JOIN player_stats ps ON p.player_id = ps.player_id
GROUP BY p.player_id, p.name, p.category
HAVING COUNT(ps.stat_id) >= 1
ORDER BY avg_rating DESC;

-- 8. View: Academy Dashboard Stats
CREATE OR REPLACE VIEW academy_dashboard AS
SELECT
  (SELECT COUNT(*) FROM players WHERE name NOT ILIKE '[REQ]%') as total_players,
  (SELECT COUNT(*) FROM teams) as total_teams,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT SUM(amount) FROM payments) as total_revenue,
  (SELECT COUNT(*) FROM ems_matches WHERE match_date = CURRENT_DATE) as matches_today,
  (SELECT COUNT(*) FROM training WHERE date = CURRENT_DATE) as trainings_today;

-- 9. View: Today Attendance
CREATE OR REPLACE VIEW today_attendance AS
SELECT 
  p.name as player_name,
  t.team_name,
  a.status,
  a.check_in_time,
  tr.start_time
FROM attendance a
JOIN players p ON a.player_id = p.player_id
JOIN teams t ON p.team_id = t.team_id
JOIN training tr ON a.training_id = tr.training_id
WHERE tr.date = CURRENT_DATE;

-- 10. Automation for QR Codes on Player Insert (if not handled by app)
CREATE OR REPLACE FUNCTION fn_generate_player_qr()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := 'ULTRA26-' || LPAD(NEW.player_id::text, 6, '0') || '-' || to_char(NEW.birth_date, 'YYYYMMDD');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_qr ON players;
CREATE TRIGGER tr_generate_qr
BEFORE INSERT ON players
FOR EACH ROW
EXECUTE FUNCTION fn_generate_player_qr();

-- 11. Subscription Status Auto-Update (Optional: Run via Cron or on Login)
-- For now, we can create a function to check expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'منتهي'
  WHERE end_date < CURRENT_DATE AND status = 'نشط';
END;
$$ LANGUAGE plpgsql;
