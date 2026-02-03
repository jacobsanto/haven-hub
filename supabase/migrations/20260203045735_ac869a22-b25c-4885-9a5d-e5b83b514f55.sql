-- Create trigger function to auto-sync bookings to availability table
CREATE OR REPLACE FUNCTION public.sync_booking_to_availability()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d DATE;
  old_d DATE;
BEGIN
  -- On INSERT or UPDATE with non-cancelled status: block the booking dates
  IF (TG_OP = 'INSERT' AND NEW.status IN ('pending', 'confirmed')) OR 
     (TG_OP = 'UPDATE' AND NEW.status IN ('pending', 'confirmed')) THEN
    
    -- If UPDATE, first unblock old dates if they changed
    IF TG_OP = 'UPDATE' AND (OLD.check_in != NEW.check_in OR OLD.check_out != NEW.check_out OR OLD.property_id != NEW.property_id) THEN
      FOR old_d IN SELECT generate_series(OLD.check_in, OLD.check_out - INTERVAL '1 day', '1 day')::date
      LOOP
        DELETE FROM availability 
        WHERE property_id = OLD.property_id AND date = old_d;
      END LOOP;
    END IF;
    
    -- Block all dates from check_in to check_out (exclusive - checkout day is available)
    FOR d IN SELECT generate_series(NEW.check_in, NEW.check_out - INTERVAL '1 day', '1 day')::date
    LOOP
      INSERT INTO availability (property_id, date, available)
      VALUES (NEW.property_id, d, false)
      ON CONFLICT (property_id, date) DO UPDATE SET available = false;
    END LOOP;
  END IF;
  
  -- On DELETE or status change to cancelled: unblock dates
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
    FOR d IN SELECT generate_series(
      COALESCE(OLD.check_in, NEW.check_in), 
      COALESCE(OLD.check_out, NEW.check_out) - INTERVAL '1 day', 
      '1 day'
    )::date
    LOOP
      DELETE FROM availability 
      WHERE property_id = COALESCE(OLD.property_id, NEW.property_id) AND date = d;
    END LOOP;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_sync_booking_to_availability ON bookings;
CREATE TRIGGER trigger_sync_booking_to_availability
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_to_availability();