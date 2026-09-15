CREATE TABLE public.peladas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Pelada da Semana',
  weekday smallint,
  start_time time,
  end_time time,
  location text,
  next_date date,
  max_players integer,
  status text NOT NULL DEFAULT 'aberta',
  confirm_deadline timestamptz,
  notes text,
  public_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.peladas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peladas TO authenticated;
GRANT ALL ON public.peladas TO service_role;

ALTER TABLE public.peladas ENABLE ROW LEVEL SECURITY;

CREATE POLICY peladas_public_read ON public.peladas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY peladas_admin_all ON public.peladas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER peladas_set_updated_at BEFORE UPDATE ON public.peladas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pelada_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  guest_name text,
  status text NOT NULL DEFAULT 'confirmado',
  team_no smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pelada_participants_player_unique
  ON public.pelada_participants (pelada_id, player_id) WHERE player_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pelada_participants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pelada_participants TO authenticated;
GRANT ALL ON public.pelada_participants TO service_role;

ALTER TABLE public.pelada_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY pelada_participants_public_read ON public.pelada_participants
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY pelada_participants_public_insert ON public.pelada_participants
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.peladas p WHERE p.id = pelada_id AND p.status = 'aberta'));

CREATE POLICY pelada_participants_public_update ON public.pelada_participants
  FOR UPDATE TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.peladas p WHERE p.id = pelada_id AND p.status = 'aberta'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.peladas p WHERE p.id = pelada_id AND p.status = 'aberta'));

CREATE POLICY pelada_participants_public_delete ON public.pelada_participants
  FOR DELETE TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.peladas p WHERE p.id = pelada_id AND p.status = 'aberta'));

CREATE POLICY pelada_participants_admin_all ON public.pelada_participants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER pelada_participants_set_updated_at BEFORE UPDATE ON public.pelada_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
