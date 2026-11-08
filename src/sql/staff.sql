-- إنشاء جدول الموظفين (Roles and Staff)
CREATE TABLE IF NOT EXISTS public.staff (
    staff_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('staff_storekeeper', 'staff_doctor', 'staff_assistant')),
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- إعداد صلاحيات الصفوف (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to staff" ON public.staff 
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert to staff" ON public.staff 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to staff" ON public.staff 
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to staff" ON public.staff 
    FOR DELETE USING (true);
