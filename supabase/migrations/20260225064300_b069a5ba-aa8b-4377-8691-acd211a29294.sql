
CREATE TABLE public.section_display_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL,
  section_key text NOT NULL,
  layout_mode text NOT NULL DEFAULT 'grid',
  columns integer NOT NULL DEFAULT 3,
  animation text NOT NULL DEFAULT 'fade-up',
  autoplay boolean NOT NULL DEFAULT false,
  autoplay_interval integer NOT NULL DEFAULT 5,
  items_per_view integer NOT NULL DEFAULT 3,
  show_navigation boolean NOT NULL DEFAULT true,
  show_dots boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_slug, section_key)
);

ALTER TABLE public.section_display_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read section display settings"
  ON public.section_display_settings FOR SELECT USING (true);

CREATE POLICY "Admin can manage section display settings"
  ON public.section_display_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.section_display_settings (page_slug, section_key, layout_mode, columns) VALUES
  ('home', 'properties', 'grid', 3),
  ('home', 'destinations', 'grid', 3),
  ('home', 'experiences', 'grid', 4),
  ('home', 'blog', 'grid', 3),
  ('properties', 'grid', 'grid', 4),
  ('destinations', 'grid', 'grid', 3),
  ('experiences', 'grid', 'grid', 3),
  ('about', 'values', 'grid', 4);
