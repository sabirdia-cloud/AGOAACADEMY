-- Add password column to coaches table
alter table public.coaches add column if not exists password text;
alter table public.coaches add column if not exists username text;

-- Update existing coaches with default password if null
update public.coaches set password = 'coach123' where password is null;
