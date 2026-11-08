-- Parents table (نظام حسابات الأولياء)
DROP TABLE IF EXISTS parent_messages CASCADE;
DROP TABLE IF EXISTS parent_notifications CASCADE;
DROP TABLE IF EXISTS parent_players CASCADE;
DROP TABLE IF EXISTS parents CASCADE;

CREATE TABLE parents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationship table: Parent -> Players (علاقة الربط)
CREATE TABLE parent_players (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_id BIGINT REFERENCES parents(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    UNIQUE(parent_id, player_id)
);

-- Add parent fields to players table for requests
ALTER TABLE players ADD COLUMN IF NOT EXISTS parent_username TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS parent_password TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES parents(id) ON DELETE SET NULL;

-- Enable RLS for security
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_players ENABLE ROW LEVEL SECURITY;

-- Policies for Admin & Parents (Using DO blocks to avoid errors if exists)
DO $$ BEGIN
    -- Allow all for authenticated (Admin/Staff)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated users on parents') THEN
        CREATE POLICY "Allow all for authenticated users on parents" ON parents FOR ALL TO authenticated USING (true);
    END IF;
    
    -- Allow INSERT for anonymous users (Signup)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert for anon on parents') THEN
        CREATE POLICY "Allow insert for anon on parents" ON parents FOR INSERT TO anon WITH CHECK (true);
    END IF;

    -- Allow SELECT for anonymous users (Login)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for anon on parents') THEN
        CREATE POLICY "Allow select for anon on parents" ON parents FOR SELECT TO anon USING (true);
    END IF;

    -- Allow UPDATE for anonymous users (Admin Edits)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow update for anon on parents') THEN
        CREATE POLICY "Allow update for anon on parents" ON parents FOR UPDATE TO anon USING (true);
    END IF;

    -- Allow DELETE for anonymous users (Admin Deletes)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow delete for anon on parents') THEN
        CREATE POLICY "Allow delete for anon on parents" ON parents FOR DELETE TO anon USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated users on parent_players') THEN
        CREATE POLICY "Allow all for authenticated users on parent_players" ON parent_players FOR ALL TO authenticated USING (true);
    END IF;

    -- Allow ALL for anon on parent_players (to manage links)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon on parent_players') THEN
        CREATE POLICY "Allow all for anon on parent_players" ON parent_players FOR ALL TO anon USING (true);
    END IF;
END $$;

-- Individual Parent Messages (الرسائل الخاصة للأولياء)
CREATE TABLE parent_messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_id BIGINT REFERENCES parents(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated users on parent_messages') THEN
        CREATE POLICY "Allow all for authenticated users on parent_messages" ON parent_messages FOR ALL TO authenticated USING (true);
    END IF;
    -- Allow SELECT for anon on parent_messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for anon on parent_messages') THEN
        CREATE POLICY "Allow select for anon on parent_messages" ON parent_messages FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- Parent Notifications Table
CREATE TABLE IF NOT EXISTS parent_notifications (
    notification_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_id BIGINT REFERENCES parents(id) ON DELETE CASCADE,
    parent_identifier TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'عام',
    is_read BOOLEAN DEFAULT FALSE,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    -- Allow SELECT, INSERT and UPDATE for anon on parent_notifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for anon on parent_notifications') THEN
        CREATE POLICY "Allow select for anon on parent_notifications" ON parent_notifications FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert for anon on parent_notifications') THEN
        CREATE POLICY "Allow insert for anon on parent_notifications" ON parent_notifications FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow update for anon on parent_notifications') THEN
        CREATE POLICY "Allow update for anon on parent_notifications" ON parent_notifications FOR UPDATE TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow delete for anon on parent_notifications') THEN
        CREATE POLICY "Allow delete for anon on parent_notifications" ON parent_notifications FOR DELETE TO anon USING (true);
    END IF;
END $$;
