CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nickname text,
  position text,
  shirt_number integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_date date NOT NULL DEFAULT current_date,
  opponent text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.match_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  goals integer NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists integer NOT NULL DEFAULT 0 CHECK (assists >= 0),
  played boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);

CREATE INDEX idx_match_stats_match ON public.match_stats(match_id);
CREATE INDEX idx_match_stats_player ON public.match_stats(player_id);

GRANT SELECT ON public.players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;

GRANT SELECT ON public.matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;

GRANT SELECT ON public.match_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_stats TO authenticated;
GRANT ALL ON public.match_stats TO service_role;

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_public_read" ON public.players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "players_auth_write" ON public.players FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "matches_public_read" ON public.matches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "matches_auth_write" ON public.matches FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "match_stats_public_read" ON public.match_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "match_stats_auth_write" ON public.match_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE VIEW public.player_totals
WITH (security_invoker = true) AS
SELECT
  p.id AS player_id,
  p.name,
  p.nickname,
  p.position,
  p.shirt_number,
  p.active,
  COALESCE(SUM(CASE WHEN ms.played THEN 1 ELSE 0 END), 0)::int AS matches_played,
  COALESCE(SUM(ms.goals), 0)::int AS goals,
  COALESCE(SUM(ms.assists), 0)::int AS assists,
  COALESCE(SUM(ms.goals + ms.assists), 0)::int AS contributions
FROM public.players p
LEFT JOIN public.match_stats ms ON ms.player_id = p.id
GROUP BY p.id;

GRANT SELECT ON public.player_totals TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER players_set_updated_at BEFORE UPDATE ON public.players
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER matches_set_updated_at BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();