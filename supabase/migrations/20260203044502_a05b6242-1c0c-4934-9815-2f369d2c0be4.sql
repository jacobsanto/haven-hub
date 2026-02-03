-- Add availability_bookings to allowed sync_type values
ALTER TABLE pms_sync_runs 
DROP CONSTRAINT IF EXISTS pms_sync_runs_sync_type_check;

ALTER TABLE pms_sync_runs 
ADD CONSTRAINT pms_sync_runs_sync_type_check 
CHECK (sync_type = ANY (ARRAY['full', 'property', 'availability', 'rates', 'booking', 'availability_bookings']));