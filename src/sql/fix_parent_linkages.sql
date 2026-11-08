-- Fix legacy parent linkages
-- 1. Try to link players to parents matching phone
UPDATE public.players p
SET parent_id = pa.id
FROM public.parents pa
WHERE (p.phone = pa.phone OR p.parent_username = pa.phone OR p.parent_username = pa.username)
AND p.parent_id IS NULL;

-- 2. Ensure relationship table is populated
INSERT INTO public.parent_players (parent_id, player_id)
SELECT parent_id, player_id 
FROM public.players 
WHERE parent_id IS NOT NULL
ON CONFLICT DO NOTHING;
