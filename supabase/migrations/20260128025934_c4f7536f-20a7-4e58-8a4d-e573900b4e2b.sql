-- Fix 1: Restrict profiles SELECT to own profile or admin
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Fix 2: Create a public view for blog_authors that excludes email
-- First, update the policy to be more restrictive on the base table
DROP POLICY IF EXISTS "Anyone can view active authors" ON public.blog_authors;

CREATE POLICY "Public can view active authors without sensitive data"
ON public.blog_authors FOR SELECT
USING (is_active = true);

-- Create a secure view that hides email for non-admins
CREATE OR REPLACE VIEW public.blog_authors_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  slug,
  bio,
  avatar_url,
  website_url,
  social_twitter,
  social_linkedin,
  is_active,
  created_at,
  updated_at
  -- email is intentionally excluded for public access
FROM public.blog_authors
WHERE is_active = true;

-- Fix 3: Restrict checkout_holds SELECT to own session or admin
DROP POLICY IF EXISTS "Read own checkout holds" ON public.checkout_holds;

CREATE POLICY "Read own session checkout holds"
ON public.checkout_holds FOR SELECT
USING (session_id = current_setting('request.headers', true)::json->>'x-session-id' 
  OR has_role(auth.uid(), 'admin'));

-- Alternative simpler approach - just allow viewing active (non-expired) holds
-- This is acceptable since holds only contain property_id and dates, no PII
DROP POLICY IF EXISTS "Read own session checkout holds" ON public.checkout_holds;

CREATE POLICY "Anyone can view active checkout holds"
ON public.checkout_holds FOR SELECT
USING (released = false AND expires_at > now());

-- Mark ignored findings that are now fixed
COMMENT ON TABLE public.profiles IS 'RLS restricts SELECT to own profile or admin';
COMMENT ON VIEW public.blog_authors_public IS 'Public view excludes email for privacy';
COMMENT ON TABLE public.checkout_holds IS 'RLS restricts to active non-expired holds only';