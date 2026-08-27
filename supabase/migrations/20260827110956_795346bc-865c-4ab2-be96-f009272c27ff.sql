DROP POLICY IF EXISTS saved_art_templates_read ON public.saved_art_templates;
CREATE POLICY saved_art_templates_admin_read ON public.saved_art_templates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

DROP POLICY IF EXISTS team_events_auth_read ON public.team_events;
CREATE POLICY team_events_auth_read ON public.team_events FOR SELECT TO authenticated USING (public_visible = true OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));