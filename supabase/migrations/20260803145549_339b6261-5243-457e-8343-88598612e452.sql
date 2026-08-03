ALTER TABLE public.team_events ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS team_events_public_read ON public.team_events;
CREATE POLICY team_events_public_read ON public.team_events
FOR SELECT TO anon
USING (public_visible = true);