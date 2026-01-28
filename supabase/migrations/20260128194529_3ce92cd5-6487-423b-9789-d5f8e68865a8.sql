-- Add last_availability_sync_at column to pms_property_map
ALTER TABLE public.pms_property_map
ADD COLUMN last_availability_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;