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
    AND e.event_date >= GREATEST(from_date, CURRENT_DATE)
    AND e.event_date <= LEAST(to_date, CURRENT_DATE + 120)
$$;

REVOKE ALL ON FUNCTION public.busy_periods(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.busy_periods(date, date) TO anon, authenticated;