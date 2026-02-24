
CREATE TABLE public.pms_provider_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  api_docs_url text,
  auth_type text NOT NULL DEFAULT 'api_key',
  auth_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  base_url text,
  token_url text,
  token_scope text,
  setup_steps jsonb DEFAULT '[]'::jsonb,
  edge_function_name text,
  capabilities jsonb DEFAULT '{}'::jsonb,
  is_builtin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pms_provider_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage provider registry"
  ON public.pms_provider_registry FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read provider registry"
  ON public.pms_provider_registry FOR SELECT
  TO anon, authenticated
  USING (true);
