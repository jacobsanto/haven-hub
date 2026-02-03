-- Fix bookings table RLS policies to prevent public data exposure
-- Replace restrictive policies with proper permissive policies

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Public can create bookings with validation" ON bookings;

-- Create permissive admin-only SELECT policy (blocks public access)
CREATE POLICY "Admin can view bookings"
ON bookings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create permissive admin-only UPDATE policy  
CREATE POLICY "Admin can update bookings"
ON bookings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create permissive admin-only DELETE policy
CREATE POLICY "Admin can delete bookings"
ON bookings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create permissive public INSERT policy with validation (required for booking flow)
CREATE POLICY "Public can create bookings"
ON bookings FOR INSERT
WITH CHECK (
  guest_name IS NOT NULL 
  AND guest_email IS NOT NULL 
  AND guest_email ~ '^[^@]+@[^@]+\.[^@]+$'
  AND check_in IS NOT NULL 
  AND check_out IS NOT NULL 
  AND check_out > check_in 
  AND nights > 0 
  AND total_price >= 0
);