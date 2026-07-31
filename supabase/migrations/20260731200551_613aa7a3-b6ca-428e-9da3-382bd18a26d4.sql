CREATE TABLE public.recurring_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  whatsapp text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.recurring_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_slots TO authenticated;
GRANT ALL ON public.recurring_slots TO service_role;

ALTER TABLE public.recurring_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY recurring_slots_public_read ON public.recurring_slots
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY recurring_slots_admin_write ON public.recurring_slots
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER recurring_slots_set_updated_at
  BEFORE UPDATE ON public.recurring_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.busy_periods(from_date date, to_date date)
RETURNS TABLE (event_date date, start_time time, end_time time)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.event_date, e.start_time, e.end_time
  FROM public.team_events e
  WHERE e.event_type <> 'disponivel'
    AND e.status <> 'disponivel'
    AND e.event_date BETWEEN from_date AND to_date
$$;

GRANT EXECUTE ON FUNCTION public.busy_periods(date, date) TO anon, authenticated;