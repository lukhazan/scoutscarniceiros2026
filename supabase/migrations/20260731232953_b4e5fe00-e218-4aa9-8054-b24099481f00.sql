CREATE TABLE public.match_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  contact_name text NOT NULL,
  whatsapp text NOT NULL,
  request_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  notes text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.match_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_requests TO authenticated;
GRANT ALL ON public.match_requests TO service_role;

ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_requests_public_insert ON public.match_requests
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pendente');

CREATE POLICY match_requests_admin_read ON public.match_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY match_requests_admin_update ON public.match_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY match_requests_admin_delete ON public.match_requests
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER match_requests_set_updated_at BEFORE UPDATE ON public.match_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS team_events_public_slots ON public.team_events;
CREATE POLICY team_events_public_read ON public.team_events
  FOR SELECT TO anon USING (true);