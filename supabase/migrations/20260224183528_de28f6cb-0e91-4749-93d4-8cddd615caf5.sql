
-- Navigation items table
CREATE TABLE public.navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL DEFAULT 'header',
  label text NOT NULL,
  path text NOT NULL,
  icon text DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  show_on_mobile boolean NOT NULL DEFAULT true,
  priority boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible navigation items"
  ON public.navigation_items FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admin can manage navigation items"
  ON public.navigation_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Hero settings table
CREATE TABLE public.hero_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hero settings"
  ON public.hero_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage hero settings"
  ON public.hero_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed header navigation
INSERT INTO public.navigation_items (placement, label, path, sort_order, priority) VALUES
  ('header', 'Properties', '/properties', 0, true),
  ('header', 'Destinations', '/destinations', 1, false),
  ('header', 'Experiences', '/experiences', 2, true),
  ('header', 'Blog', '/blog', 3, false),
  ('header', 'About', '/about', 4, true);

-- Seed hero quick-nav
INSERT INTO public.navigation_items (placement, label, path, icon, sort_order) VALUES
  ('hero_quicknav', 'Destinations', '/destinations', 'MapPin', 0),
  ('hero_quicknav', 'Properties', '/properties', 'Home', 1),
  ('hero_quicknav', 'Experiences', '/experiences', 'Sparkles', 2),
  ('hero_quicknav', 'Stories', '/blog', 'BookOpen', 3);

-- Seed footer explore
INSERT INTO public.navigation_items (placement, label, path, sort_order) VALUES
  ('footer_explore', 'All Properties', '/properties', 0),
  ('footer_explore', 'Destinations', '/destinations', 1),
  ('footer_explore', 'Experiences', '/experiences', 2),
  ('footer_explore', 'Blog', '/blog', 3);

-- Seed footer company
INSERT INTO public.navigation_items (placement, label, path, sort_order) VALUES
  ('footer_company', 'About Us', '/about', 0),
  ('footer_company', 'Contact', '/contact', 1),
  ('footer_company', 'Privacy Policy', '/privacy', 2),
  ('footer_company', 'Terms of Service', '/terms', 3);

-- Seed hero settings
INSERT INTO public.hero_settings (key, value) VALUES
  ('show_search_bar', 'true'),
  ('show_featured_villa', 'true'),
  ('featured_property_id', 'auto'),
  ('show_quick_nav', 'true');
