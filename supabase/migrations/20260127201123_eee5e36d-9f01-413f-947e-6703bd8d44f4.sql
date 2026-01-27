-- Create enum for contact submission status
CREATE TYPE public.contact_status AS ENUM ('new', 'read', 'responded');

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status contact_status NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can submit a contact form (public insert)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
WITH CHECK (
    name IS NOT NULL AND 
    email IS NOT NULL AND 
    subject IS NOT NULL AND 
    message IS NOT NULL
);

-- Admins can view all submissions
CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update submissions (change status)
CREATE POLICY "Admins can update contact submissions"
ON public.contact_submissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete submissions
CREATE POLICY "Admins can delete contact submissions"
ON public.contact_submissions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));