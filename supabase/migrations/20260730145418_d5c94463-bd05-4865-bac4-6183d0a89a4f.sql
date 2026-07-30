ALTER VIEW public.player_totals SET (security_invoker = on);
GRANT SELECT ON public.player_totals TO anon, authenticated;
GRANT ALL ON public.player_totals TO service_role;