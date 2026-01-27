-- Create enum for destination status
CREATE TYPE public.destination_status AS ENUM ('active', 'draft');

-- Create destinations table
CREATE TABLE public.destinations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    hero_image_url TEXT,
    gallery TEXT[] DEFAULT '{}',
    highlights TEXT[] DEFAULT '{}',
    best_time_to_visit TEXT,
    climate TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status destination_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view active destinations
CREATE POLICY "Anyone can view active destinations"
ON public.destinations
FOR SELECT
USING (status = 'active');

-- Admins can view all destinations
CREATE POLICY "Admins can view all destinations"
ON public.destinations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert destinations
CREATE POLICY "Admins can insert destinations"
ON public.destinations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update destinations
CREATE POLICY "Admins can update destinations"
ON public.destinations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete destinations
CREATE POLICY "Admins can delete destinations"
ON public.destinations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON public.destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Santorini data
INSERT INTO public.destinations (
    name,
    slug,
    country,
    description,
    long_description,
    highlights,
    best_time_to_visit,
    climate,
    is_featured,
    status
) VALUES (
    'Santorini',
    'santorini',
    'Greece',
    'A stunning volcanic island in the Aegean Sea, famous for its dramatic views, whitewashed buildings, and spectacular sunsets.',
    'Santorini is one of the Cyclades islands in the Aegean Sea, shaped by a volcanic eruption that formed its rugged landscape. The island is famous for its stunning caldera views, blue-domed churches, and villages perched on dramatic cliffs. The two main towns, Fira and Oia, are known for their white-washed cubic houses, winding lanes, and breathtaking sunset views. Beyond the famous vistas, Santorini offers unique beaches with red, black, and white volcanic sand, ancient ruins at Akrotiri, and exceptional local wines produced from grapes grown in the island''s volcanic soil.',
    ARRAY['Iconic blue-domed churches and whitewashed architecture', 'World-famous sunsets in Oia', 'Unique volcanic beaches', 'Award-winning local wines', 'Ancient ruins of Akrotiri', 'Stunning caldera views'],
    'Late April to early November, with peak season in July and August',
    'Mediterranean climate with hot, dry summers and mild, wet winters',
    true,
    'active'
);