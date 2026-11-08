-- Add current_season and theme columns to academy_settings
alter table public.academy_settings 
add column if not exists current_season text default '2025/2026',
add column if not exists theme text default 'dark';
