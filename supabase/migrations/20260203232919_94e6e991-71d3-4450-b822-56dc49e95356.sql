-- Create trigger to sync booking changes to availability table
-- This ensures local booking creations/cancellations immediately update availability
CREATE TRIGGER sync_booking_availability_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_booking_to_availability();