ALTER TABLE public.match_stats ADD COLUMN IF NOT EXISTS goals_conceded integer NOT NULL DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS initial_conceded integer NOT NULL DEFAULT 0;

DROP VIEW IF EXISTS public.player_totals;
CREATE VIEW public.player_totals AS
 SELECT p.id AS player_id,
    p.name,
    p.nickname,
    p."position",
    p.shirt_number,
    p.active,
    p.initial_goals,
    p.photo_url,
    COALESCE(sum(CASE WHEN ms.played THEN 1 ELSE 0 END), 0::bigint)::integer AS matches_played,
    (p.initial_goals + COALESCE(sum(ms.goals), 0::bigint))::integer AS goals,
    (p.initial_assists + COALESCE(sum(ms.assists), 0::bigint))::integer AS assists,
    (p.initial_conceded + COALESCE(sum(ms.goals_conceded), 0::bigint))::integer AS goals_conceded,
    (p.initial_goals + p.initial_assists + COALESCE(sum(ms.goals + ms.assists), 0::bigint))::integer AS contributions
   FROM players p
     LEFT JOIN match_stats ms ON ms.player_id = p.id
  GROUP BY p.id;

GRANT SELECT ON public.player_totals TO anon, authenticated;
GRANT ALL ON public.player_totals TO service_role;