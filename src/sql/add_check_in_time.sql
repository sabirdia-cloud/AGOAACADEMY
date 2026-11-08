-- Add check_in_time column to attendance table
alter table public.attendance add column if not exists check_in_time time;
