-- Add cancellation_policy column to rate_plans table
ALTER TABLE rate_plans 
ADD COLUMN cancellation_policy text NOT NULL DEFAULT 'moderate';

-- Add constraint for valid values
ALTER TABLE rate_plans 
ADD CONSTRAINT valid_cancellation_policy 
CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict', 'non_refundable'));

-- Add cancellation_policy column to bookings table to capture policy at time of booking
ALTER TABLE bookings 
ADD COLUMN cancellation_policy text DEFAULT 'moderate';

-- Add constraint for valid values on bookings
ALTER TABLE bookings 
ADD CONSTRAINT valid_booking_cancellation_policy 
CHECK (cancellation_policy IS NULL OR cancellation_policy IN ('flexible', 'moderate', 'strict', 'non_refundable'));