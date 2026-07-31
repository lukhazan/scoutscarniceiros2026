DROP POLICY IF EXISTS team_settings_public_read ON public.team_settings;

CREATE POLICY team_settings_anon_whatsapp_read ON public.team_settings
  FOR SELECT TO anon USING (key = 'whatsapp_number');

CREATE POLICY team_settings_auth_read ON public.team_settings
  FOR SELECT TO authenticated USING (true);