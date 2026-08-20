CREATE TABLE public.saved_art_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  base_slug text NOT NULL,
  art_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  editable_fields text[] NOT NULL DEFAULT ARRAY['playerPhoto','playerName']::text[],
  preview_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_art_templates TO authenticated;
GRANT ALL ON public.saved_art_templates TO service_role;

ALTER TABLE public.saved_art_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_art_templates_read" ON public.saved_art_templates
FOR SELECT TO authenticated USING (true);

CREATE POLICY "saved_art_templates_admin_write" ON public.saved_art_templates
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE TRIGGER saved_art_templates_set_updated_at
BEFORE UPDATE ON public.saved_art_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();