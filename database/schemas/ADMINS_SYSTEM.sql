CREATE TABLE IF NOT EXISTS public.admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.admins (username, password, full_name, role_title)
VALUES ('admin', 'admin123', 'المدير العام', 'مدير النظام')
ON CONFLICT DO NOTHING;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Admins" ON public.admins;
CREATE POLICY "Allow All Admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
