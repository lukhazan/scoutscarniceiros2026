ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS initial_goals integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initial_assists integer NOT NULL DEFAULT 0;

DROP VIEW IF EXISTS public.player_totals;
CREATE VIEW public.player_totals AS
SELECT p.id AS player_id,
    p.name,
    p.nickname,
    p."position",
    p.shirt_number,
    p.active,
    p.initial_goals,
    p.initial_assists,
    COALESCE(sum(CASE WHEN ms.played THEN 1 ELSE 0 END), 0::bigint)::integer AS matches_played,
    (p.initial_goals + COALESCE(sum(ms.goals), 0::bigint))::integer AS goals,
    (p.initial_assists + COALESCE(sum(ms.assists), 0::bigint))::integer AS assists,
    (p.initial_goals + p.initial_assists + COALESCE(sum(ms.goals + ms.assists), 0::bigint))::integer AS contributions
   FROM public.players p
     LEFT JOIN public.match_stats ms ON ms.player_id = p.id
  GROUP BY p.id;