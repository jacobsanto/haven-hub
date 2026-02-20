
-- Fix bookings SELECT policy: drop existing and recreate as PERMISSIVE with TO authenticated
DROP POLICY IF EXISTS "Admin can view bookings" ON public.bookings;

CREATE POLICY "Admin can view bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also fix booking_payments SELECT policy for the same reason
DROP POLICY IF EXISTS "Admin can view payments" ON public.booking_payments;

CREATE POLICY "Admin can view payments"
ON public.booking_payments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
