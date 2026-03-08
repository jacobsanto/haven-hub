-- Create testimonials table for dynamic, admin-managed guest reviews
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL DEFAULT 'direct',
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  location TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can read active testimonials
CREATE POLICY "testimonials_public_read"
  ON public.testimonials
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all testimonials
CREATE POLICY "testimonials_admin_all"
  ON public.testimonials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'testimonials_updated_at'
  ) THEN
    CREATE TRIGGER testimonials_updated_at
      BEFORE UPDATE ON public.testimonials
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

-- Seed with the three starter testimonials
INSERT INTO public.testimonials (platform, text, author, location, rating, display_order)
VALUES
  (
    'booking',
    'The villa was a dream — waking up to the caldera view, the private infinity pool catching the morning light. The team arranged a sunset sailing trip that became the highlight of our entire year.',
    'Elena & Marco',
    'Santorini, August 2025',
    5,
    1
  ),
  (
    'tripadvisor',
    'From the moment we arrived, everything was perfect. The villa exceeded our expectations in every way. The concierge service was exceptional and truly made our stay unforgettable.',
    'Sarah M.',
    'Tuscany, June 2025',
    5,
    2
  ),
  (
    'booking',
    'A truly luxurious experience. The attention to detail, the private pool, the location — everything was world-class. We''ve already booked our return trip.',
    'James K.',
    'Bali, September 2025',
    5,
    3
  );
