CREATE TABLE public.team_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'jogo',
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  opponent text,
  notes text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_events_type_check CHECK (event_type IN ('jogo','evento','festa','outro','disponivel')),
  CONSTRAINT team_events_status_check CHECK (status IN ('confirmado','pendente','disponivel'))
);

GRANT SELECT ON public.team_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_events TO authenticated;
GRANT ALL ON public.team_events TO service_role;

ALTER TABLE public.team_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_events_public_slots ON public.team_events
  FOR SELECT TO anon USING (event_type = 'disponivel');

CREATE POLICY team_events_auth_read ON public.team_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY team_events_admin_write ON public.team_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER team_events_set_updated_at
  BEFORE UPDATE ON public.team_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX team_events_date_idx ON public.team_events (event_date);