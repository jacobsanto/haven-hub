-- Add iCal URL column to pms_property_map for iCal-based availability sync
ALTER TABLE pms_property_map 
ADD COLUMN IF NOT EXISTS ical_url TEXT;

-- Add last iCal sync timestamp
ALTER TABLE pms_property_map 
ADD COLUMN IF NOT EXISTS last_ical_sync_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN pms_property_map.ical_url IS 'Tokeet iCal feed URL for this property - used for availability sync';
COMMENT ON COLUMN pms_property_map.last_ical_sync_at IS 'Last successful iCal sync timestamp';