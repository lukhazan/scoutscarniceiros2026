CREATE TABLE public.player_season_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season integer NOT NULL,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  goals_conceded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, season)
);

GRANT SELECT ON public.player_season_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_season_stats TO authenticated;
GRANT ALL ON public.player_season_stats TO service_role;

ALTER TABLE public.player_season_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY player_season_stats_public_read ON public.player_season_stats
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY player_season_stats_admin_write ON public.player_season_stats
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE TRIGGER player_season_stats_set_updated_at
  BEFORE UPDATE ON public.player_season_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.player_season_stats (player_id, season, goals, assists, goals_conceded)
SELECT id, 2026, initial_goals, initial_assists, initial_conceded
FROM public.players
WHERE initial_goals <> 0 OR initial_assists <> 0 OR initial_conceded <> 0
ON CONFLICT (player_id, season) DO NOTHING;

UPDATE public.players SET initial_goals = 0, initial_assists = 0, initial_conceded = 0;

DROP VIEW IF EXISTS public.player_totals;

CREATE VIEW public.player_totals
WITH (security_invoker = on) AS
SELECT
  p.id AS player_id,
  p.name,
  p.nickname,
  p.position,
  p.shirt_number,
  p.active,
  p.photo_url,
  p.initial_goals,
  COALESCE(m.matches_played, 0) AS matches_played,
  COALESCE(m.goals, 0) + COALESCE(s.goals, 0) AS goals,
  COALESCE(m.assists, 0) + COALESCE(s.assists, 0) AS assists,
  COALESCE(m.goals_conceded, 0) + COALESCE(s.goals_conceded, 0) AS goals_conceded,
  COALESCE(m.goals, 0) + COALESCE(s.goals, 0) + COALESCE(m.assists, 0) + COALESCE(s.assists, 0) AS contributions
FROM public.players p
LEFT JOIN (
  SELECT player_id,
         COUNT(*) FILTER (WHERE played) AS matches_played,
         SUM(goals) AS goals,
         SUM(assists) AS assists,
         SUM(goals_conceded) AS goals_conceded
  FROM public.match_stats GROUP BY player_id
) m ON m.player_id = p.id
LEFT JOIN (
  SELECT player_id, SUM(goals) AS goals, SUM(assists) AS assists, SUM(goals_conceded) AS goals_conceded
  FROM public.player_season_stats GROUP BY player_id
) s ON s.player_id = p.id;