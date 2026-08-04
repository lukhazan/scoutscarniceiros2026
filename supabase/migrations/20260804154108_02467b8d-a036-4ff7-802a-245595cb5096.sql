CREATE TABLE public.brand_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL DEFAULT 'Carniceiros Fut 7',
  crest_url text,
  crest_white_url text,
  crest_black_url text,
  footer_logo_url text,
  primary_color text NOT NULL DEFAULT '#e11d2e',
  secondary_color text NOT NULL DEFAULT '#111111',
  accent_color text NOT NULL DEFAULT '#ffffff',
  font_primary text NOT NULL DEFAULT 'Anton',
  font_secondary text NOT NULL DEFAULT 'Inter',
  watermark_url text,
  sponsors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_identity TO authenticated;
GRANT ALL ON public.brand_identity TO service_role;
ALTER TABLE public.brand_identity ENABLE ROW LEVEL SECURITY;
CREATE POLICY brand_identity_admin_all ON public.brand_identity FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE TRIGGER brand_identity_set_updated_at BEFORE UPDATE ON public.brand_identity FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'fundo',
  url text NOT NULL,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_category_check CHECK (category IN ('fundo','escudo','patrocinador','foto'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_assets_admin_all ON public.media_assets FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE TRIGGER media_assets_set_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.art_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'partida',
  preview_url text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_background_url text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT art_templates_status_check CHECK (status IN ('ativo','rascunho','inativo'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.art_templates TO authenticated;
GRANT ALL ON public.art_templates TO service_role;
ALTER TABLE public.art_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY art_templates_admin_all ON public.art_templates FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
CREATE TRIGGER art_templates_set_updated_at BEFORE UPDATE ON public.art_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.art_templates (slug, name, category, fields, status) VALUES
('gol', 'Gol', 'partida', '["player","goals","subtitle","background"]'::jsonb, 'ativo'),
('craque', 'Craque da Partida', 'partida', '["player","subtitle","background"]'::jsonb, 'ativo');

INSERT INTO public.brand_identity (team_name) VALUES ('Carniceiros Fut 7');