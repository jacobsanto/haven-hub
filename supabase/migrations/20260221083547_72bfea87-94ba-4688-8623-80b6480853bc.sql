
-- Tighten INSERT policy to authenticated only
DROP POLICY IF EXISTS "Admin can create payments" ON public.booking_payments;
CREATE POLICY "Admin can create payments"
ON public.booking_payments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten UPDATE policy to authenticated only
DROP POLICY IF EXISTS "Admin can update payments" ON public.booking_payments;
CREATE POLICY "Admin can update payments"
ON public.booking_payments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten DELETE policy to authenticated only
DROP POLICY IF EXISTS "Admin can delete payments" ON public.booking_payments;
CREATE POLICY "Admin can delete payments"
ON public.booking_payments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
