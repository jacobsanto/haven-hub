-- Add display_name column to properties table
-- This is a customer-facing name shown on Stripe checkout, receipts, and confirmations
-- Falls back to the internal 'name' field if not set

ALTER TABLE public.properties 
ADD COLUMN display_name text NULL;

-- Add a comment to explain the column's purpose
COMMENT ON COLUMN public.properties.display_name IS 'Customer-facing name shown on Stripe checkout pages and receipts. Falls back to name if not set.';