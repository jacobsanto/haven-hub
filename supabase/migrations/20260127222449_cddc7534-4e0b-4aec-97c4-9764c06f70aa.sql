-- Rate plans for properties (seasonal rates, member rates, etc.)
CREATE TABLE public.rate_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rate_type TEXT NOT NULL DEFAULT 'standard' CHECK (rate_type IN ('standard', 'member', 'promotional', 'long_stay')),
  base_rate NUMERIC NOT NULL,
  min_stay INTEGER NOT NULL DEFAULT 1,
  max_stay INTEGER,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  member_tier_required TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fees and taxes catalog
CREATE TABLE public.fees_taxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('fixed', 'percentage', 'per_night', 'per_guest', 'per_guest_per_night')),
  amount NUMERIC NOT NULL,
  is_tax BOOLEAN NOT NULL DEFAULT false,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'base_rate', 'addons')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add-ons catalog (transfers, breakfast, experiences)
CREATE TABLE public.addons_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('transfer', 'food', 'experience', 'service', 'package')),
  price NUMERIC NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'per_person', 'per_night', 'per_person_per_night')),
  max_quantity INTEGER,
  requires_lead_time_hours INTEGER,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Booking payments tracking
CREATE TABLE public.booking_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'balance', 'full', 'refund', 'addon')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Booking add-ons (items added to a booking)
CREATE TABLE public.booking_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addons_catalog(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  guest_count INTEGER,
  scheduled_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupons and promotions
CREATE TABLE public.coupons_promos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_addon')),
  discount_value NUMERIC NOT NULL,
  min_nights INTEGER,
  min_booking_value NUMERIC,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  applicable_properties UUID[],
  stackable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PMS connections config
CREATE TABLE public.pms_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pms_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PMS property mapping
CREATE TABLE public.pms_property_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  pms_connection_id UUID NOT NULL REFERENCES public.pms_connections(id) ON DELETE CASCADE,
  external_property_id TEXT NOT NULL,
  external_property_name TEXT,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pms_connection_id, external_property_id)
);

-- PMS raw events storage
CREATE TABLE public.pms_raw_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pms_connection_id UUID REFERENCES public.pms_connections(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('webhook', 'sync', 'manual')),
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PMS sync run logs
CREATE TABLE public.pms_sync_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pms_connection_id UUID NOT NULL REFERENCES public.pms_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'availability', 'rates', 'bookings')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Checkout holds (temporary inventory locks)
CREATE TABLE public.checkout_holds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  session_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  released BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log for all critical operations
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons_promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_property_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Public read policies for customer-facing tables
CREATE POLICY "Public can read active rate plans" ON public.rate_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active fees and taxes" ON public.fees_taxes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active addons" ON public.addons_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active coupons" ON public.coupons_promos
  FOR SELECT USING (is_active = true);

-- Admin-only policies for management tables (corrected argument order: user_id first, role second)
CREATE POLICY "Admin can manage rate plans" ON public.rate_plans
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage fees taxes" ON public.fees_taxes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage addons" ON public.addons_catalog
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage booking payments" ON public.booking_payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage booking addons" ON public.booking_addons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage coupons" ON public.coupons_promos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage pms connections" ON public.pms_connections
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage pms property map" ON public.pms_property_map
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can view pms raw events" ON public.pms_raw_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can manage pms sync runs" ON public.pms_sync_runs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage checkout holds" ON public.checkout_holds
  FOR ALL USING (true);

CREATE POLICY "Admin can view audit log" ON public.audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Checkout holds insert policy for anonymous users
CREATE POLICY "Anyone can create checkout holds" ON public.checkout_holds
  FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_rate_plans_property ON public.rate_plans(property_id);
CREATE INDEX idx_rate_plans_dates ON public.rate_plans(valid_from, valid_until);
CREATE INDEX idx_fees_taxes_property ON public.fees_taxes(property_id);
CREATE INDEX idx_addons_category ON public.addons_catalog(category);
CREATE INDEX idx_booking_payments_booking ON public.booking_payments(booking_id);
CREATE INDEX idx_booking_addons_booking ON public.booking_addons(booking_id);
CREATE INDEX idx_coupons_code ON public.coupons_promos(code);
CREATE INDEX idx_pms_property_map_property ON public.pms_property_map(property_id);
CREATE INDEX idx_pms_raw_events_processed ON public.pms_raw_events(processed);
CREATE INDEX idx_checkout_holds_property ON public.checkout_holds(property_id);
CREATE INDEX idx_checkout_holds_expires ON public.checkout_holds(expires_at);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

-- Update trigger for updated_at columns
CREATE TRIGGER update_rate_plans_updated_at BEFORE UPDATE ON public.rate_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_addons_catalog_updated_at BEFORE UPDATE ON public.addons_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_payments_updated_at BEFORE UPDATE ON public.booking_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pms_connections_updated_at BEFORE UPDATE ON public.pms_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();