
-- 1. Drop the public SELECT policy that exposes all active coupons
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons_promos;

-- 2. Create a secure RPC function that validates a single coupon by code
-- Returns only the necessary fields if valid, nothing if invalid
CREATE OR REPLACE FUNCTION public.validate_coupon(
  _code text,
  _property_id uuid,
  _nights integer,
  _booking_value numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _coupon record;
  _today date := CURRENT_DATE;
BEGIN
  -- Look up the coupon by exact code match
  SELECT * INTO _coupon
  FROM public.coupons_promos
  WHERE code = UPPER(_code)
    AND is_active = true
    AND valid_from <= _today
    AND valid_until >= _today;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon code');
  END IF;

  -- Check usage limit
  IF _coupon.max_uses IS NOT NULL AND _coupon.uses_count >= _coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon has reached its usage limit');
  END IF;

  -- Check minimum nights
  IF _coupon.min_nights IS NOT NULL AND _nights < _coupon.min_nights THEN
    RETURN jsonb_build_object('valid', false, 'error', format('Minimum %s nights required for this coupon', _coupon.min_nights));
  END IF;

  -- Check minimum booking value
  IF _coupon.min_booking_value IS NOT NULL AND _booking_value < _coupon.min_booking_value THEN
    RETURN jsonb_build_object('valid', false, 'error', format('Minimum booking value of €%s required', _coupon.min_booking_value));
  END IF;

  -- Check applicable properties
  IF _coupon.applicable_properties IS NOT NULL AND array_length(_coupon.applicable_properties, 1) > 0 THEN
    IF NOT (_property_id::text = ANY(_coupon.applicable_properties)) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This coupon is not valid for this property');
    END IF;
  END IF;

  -- Return validated coupon data (only what the client needs)
  RETURN jsonb_build_object(
    'valid', true,
    'id', _coupon.id,
    'code', _coupon.code,
    'name', _coupon.name,
    'description', _coupon.description,
    'discount_type', _coupon.discount_type,
    'discount_value', _coupon.discount_value,
    'min_nights', _coupon.min_nights,
    'min_booking_value', _coupon.min_booking_value,
    'max_uses', _coupon.max_uses,
    'uses_count', _coupon.uses_count,
    'valid_from', _coupon.valid_from,
    'valid_until', _coupon.valid_until,
    'applicable_properties', _coupon.applicable_properties,
    'stackable', _coupon.stackable,
    'is_active', _coupon.is_active
  );
END;
$$;
