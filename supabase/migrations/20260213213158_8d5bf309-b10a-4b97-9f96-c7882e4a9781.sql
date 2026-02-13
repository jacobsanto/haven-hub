
-- Harden the public INSERT policy on experience_enquiries with email validation
DROP POLICY IF EXISTS "Public can submit enquiry" ON public.experience_enquiries;

CREATE POLICY "Public can submit enquiry"
ON public.experience_enquiries
FOR INSERT
WITH CHECK (
  name IS NOT NULL
  AND email IS NOT NULL
  AND email ~ '^[^@]+@[^@]+\.[^@]+$'
  AND experience_id IS NOT NULL
);
