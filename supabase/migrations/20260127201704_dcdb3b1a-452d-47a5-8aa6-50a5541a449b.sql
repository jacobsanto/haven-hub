-- Create enum for experience status
CREATE TYPE public.experience_status AS ENUM ('active', 'draft');

-- Create enum for enquiry status
CREATE TYPE public.enquiry_status AS ENUM ('new', 'contacted', 'confirmed', 'cancelled');

-- Create experiences table
CREATE TABLE public.experiences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    long_description TEXT,
    hero_image_url TEXT,
    gallery TEXT[] DEFAULT '{}',
    duration TEXT,
    price_from NUMERIC,
    price_type TEXT DEFAULT 'per person',
    includes TEXT[] DEFAULT '{}',
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'Cultural',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status experience_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create experience_enquiries table
CREATE TABLE public.experience_enquiries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    preferred_date DATE,
    group_size INTEGER,
    message TEXT,
    status enquiry_status NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_enquiries ENABLE ROW LEVEL SECURITY;

-- Experiences RLS Policies
CREATE POLICY "Anyone can view active experiences"
ON public.experiences
FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can view all experiences"
ON public.experiences
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert experiences"
ON public.experiences
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update experiences"
ON public.experiences
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete experiences"
ON public.experiences
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Experience Enquiries RLS Policies
CREATE POLICY "Anyone can submit an enquiry"
ON public.experience_enquiries
FOR INSERT
WITH CHECK (
    name IS NOT NULL AND 
    email IS NOT NULL AND 
    experience_id IS NOT NULL
);

CREATE POLICY "Admins can view all enquiries"
ON public.experience_enquiries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update enquiries"
ON public.experience_enquiries
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete enquiries"
ON public.experience_enquiries
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();