
-- 1. Harden page_views INSERT policy with basic validation
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (
  path IS NOT NULL
  AND session_id IS NOT NULL
  AND LENGTH(session_id) >= 10
  AND LENGTH(session_id) <= 100
  AND LENGTH(path) <= 500
);

-- 2. Remove public SELECT on checkout_holds, keep admin-only
DROP POLICY IF EXISTS "Anyone can view active checkout holds" ON public.checkout_holds;
