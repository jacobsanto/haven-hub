-- Create blog post status enum
CREATE TYPE public.blog_status AS ENUM ('draft', 'published', 'archived');

-- Create blog_categories table
CREATE TABLE public.blog_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    featured_image_url TEXT,
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status blog_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog categories policies
CREATE POLICY "Anyone can view blog categories" 
ON public.blog_categories FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert blog categories" 
ON public.blog_categories FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog categories" 
ON public.blog_categories FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog categories" 
ON public.blog_categories FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Blog posts policies
CREATE POLICY "Anyone can view published blog posts" 
ON public.blog_posts FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admins can view all blog posts" 
ON public.blog_posts FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert blog posts" 
ON public.blog_posts FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog posts" 
ON public.blog_posts FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog posts" 
ON public.blog_posts FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial blog category
INSERT INTO public.blog_categories (name, slug, description) VALUES
    ('Travel Tips', 'travel-tips', 'Expert advice for the discerning traveler'),
    ('Destination Guides', 'destination-guides', 'In-depth guides to our featured locations'),
    ('Lifestyle', 'lifestyle', 'Luxury living and experiences');