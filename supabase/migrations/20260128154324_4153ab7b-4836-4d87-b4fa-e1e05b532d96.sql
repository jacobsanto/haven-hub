-- Phase 1: Expand bookings table and create supporting tables

-- 1.1 Add new columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_reference text,
ADD COLUMN IF NOT EXISTS adults integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS children integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS check_in_time time DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS check_out_time time DEFAULT '11:00',
ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS guest_country text,
ADD COLUMN IF NOT EXISTS external_booking_id text,
ADD COLUMN IF NOT EXISTS pms_sync_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS pms_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS special_requests text;

-- Create unique index on booking_reference
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference) WHERE booking_reference IS NOT NULL;

-- 1.2 Create booking_price_breakdown table
CREATE TABLE IF NOT EXISTS public.booking_price_breakdown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  line_type text NOT NULL,
  label text NOT NULL,
  amount numeric NOT NULL,
  quantity integer DEFAULT 1,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on booking_price_breakdown
ALTER TABLE public.booking_price_breakdown ENABLE ROW LEVEL SECURITY;

-- RLS policies for booking_price_breakdown
CREATE POLICY "Admin can manage price breakdown"
ON public.booking_price_breakdown
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert price breakdown with booking"
ON public.booking_price_breakdown
FOR INSERT
WITH CHECK (true);

-- 1.3 Create security_deposits table
CREATE TABLE IF NOT EXISTS public.security_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  status text DEFAULT 'pending',
  held_at timestamptz,
  released_at timestamptz,
  stripe_charge_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on security_deposits
ALTER TABLE public.security_deposits ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_deposits
CREATE POLICY "Admin can manage security deposits"
ON public.security_deposits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.4 Add property settings columns
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Athens',
ADD COLUMN IF NOT EXISTS check_in_time time DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS check_out_time time DEFAULT '11:00';

-- Enable realtime for bookings and checkout_holds (availability already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'checkout_holds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.checkout_holds;
  END IF;
END $$;