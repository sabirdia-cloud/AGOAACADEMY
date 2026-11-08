-- Enable RLS but allow public access since the app uses mock auth (requests come as 'anon')
alter table public.match_squads enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Enable read access for all users" on public.match_squads;
drop policy if exists "Enable insert for authenticated users only" on public.match_squads;
drop policy if exists "Enable delete for authenticated users only" on public.match_squads;
drop policy if exists "Enable all access for anon" on public.match_squads;

-- Create permissive policy for the demo app
create policy "Enable all access for anon" on public.match_squads
  for all using (true) with check (true);
