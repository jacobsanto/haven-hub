-- 1. Drop and recreate blog_authors_public view with built-in active filter
DROP VIEW IF EXISTS public.blog_authors_public;

CREATE VIEW public.blog_authors_public AS
SELECT
  id, name, slug, bio, avatar_url, website_url,
  social_twitter, social_linkedin,
  is_active, created_at, updated_at
FROM public.blog_authors
WHERE is_active = true;

-- 2. Remove open SELECT policy on checkout_holds (reads go through check-holds edge function)
DROP POLICY IF EXISTS "Read own checkout holds" ON public.checkout_holds;