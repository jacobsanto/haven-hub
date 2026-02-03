-- Fix booking_payments table RLS policies to prevent public data exposure
-- Replace restrictive policy with proper permissive admin-only policies

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admin can manage booking payments" ON booking_payments;

-- Create permissive admin-only SELECT policy
CREATE POLICY "Admin can view payments"
ON booking_payments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create permissive admin-only INSERT policy
CREATE POLICY "Admin can create payments"
ON booking_payments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create permissive admin-only UPDATE policy
CREATE POLICY "Admin can update payments"
ON booking_payments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create permissive admin-only DELETE policy
CREATE POLICY "Admin can delete payments"
ON booking_payments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));