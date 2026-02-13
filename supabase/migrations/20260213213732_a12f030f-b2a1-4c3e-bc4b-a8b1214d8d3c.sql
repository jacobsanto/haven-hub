
-- Add admin SELECT policy for checkout_holds (was missing after dropping public SELECT)
CREATE POLICY "Admin can view checkout holds"
ON public.checkout_holds
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
