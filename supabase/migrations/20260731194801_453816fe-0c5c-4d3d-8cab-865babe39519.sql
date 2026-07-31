CREATE TABLE public.team_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_settings TO authenticated;
GRANT ALL ON public.team_settings TO service_role;

ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_settings_public_read ON public.team_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY team_settings_admin_write ON public.team_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE TRIGGER team_settings_set_updated_at BEFORE UPDATE ON public.team_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.team_settings (key, value) VALUES ('whatsapp_number', '5511999999999');