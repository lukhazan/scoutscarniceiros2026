
CREATE TABLE public.player_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL UNIQUE REFERENCES public.players(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  due_day smallint NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'em_dia',
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_fees TO authenticated;
GRANT ALL ON public.player_fees TO service_role;
ALTER TABLE public.player_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY player_fees_admin_all ON public.player_fees
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER player_fees_set_updated_at
  BEFORE UPDATE ON public.player_fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.player_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'outro',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pendente',
  paid_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX player_debts_player_id_idx ON public.player_debts(player_id);
CREATE INDEX player_debts_status_idx ON public.player_debts(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_debts TO authenticated;
GRANT ALL ON public.player_debts TO service_role;
ALTER TABLE public.player_debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY player_debts_admin_all ON public.player_debts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER player_debts_set_updated_at
  BEFORE UPDATE ON public.player_debts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
