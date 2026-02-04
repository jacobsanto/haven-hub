-- Create audit trigger function for bookings table
CREATE OR REPLACE FUNCTION public.audit_bookings_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (
      action,
      entity_type,
      entity_id,
      user_id,
      new_values
    ) VALUES (
      'INSERT',
      'booking',
      NEW.id,
      auth.uid(),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (
      action,
      entity_type,
      entity_id,
      user_id,
      old_values,
      new_values
    ) VALUES (
      'UPDATE',
      'booking',
      NEW.id,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      action,
      entity_type,
      entity_id,
      user_id,
      old_values
    ) VALUES (
      'DELETE',
      'booking',
      OLD.id,
      auth.uid(),
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on bookings table for all modifications
DROP TRIGGER IF EXISTS audit_bookings_trigger ON public.bookings;
CREATE TRIGGER audit_bookings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.audit_bookings_changes();

-- Add comment explaining the audit trail
COMMENT ON FUNCTION public.audit_bookings_changes() IS 'Audit trail for all booking modifications - tracks INSERT, UPDATE, DELETE with full before/after state';