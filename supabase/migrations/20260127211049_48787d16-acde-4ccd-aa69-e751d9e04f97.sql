-- Phase 1: Add new columns to properties table
ALTER TABLE public.properties
ADD COLUMN destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
ADD COLUMN video_url TEXT,
ADD COLUMN virtual_tour_url TEXT,
ADD COLUMN instant_booking BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN highlights TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN rooms JSONB NOT NULL DEFAULT '[]',
ADD COLUMN neighborhood_description TEXT,
ADD COLUMN nearby_attractions JSONB NOT NULL DEFAULT '[]',
ADD COLUMN house_rules TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN cancellation_policy TEXT,
ADD COLUMN pet_policy TEXT,
ADD COLUMN bedrooms INTEGER NOT NULL DEFAULT 1,
ADD COLUMN bathrooms NUMERIC NOT NULL DEFAULT 1,
ADD COLUMN property_type TEXT NOT NULL DEFAULT 'villa';

-- Create index on destination_id for faster lookups
CREATE INDEX idx_properties_destination_id ON public.properties(destination_id);

-- Create index on property_type for filtering
CREATE INDEX idx_properties_property_type ON public.properties(property_type);

-- Create index on instant_booking for filtering
CREATE INDEX idx_properties_instant_booking ON public.properties(instant_booking);

-- Create seasonal_rates table for dynamic pricing
CREATE TABLE public.seasonal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  nightly_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_multiplier CHECK (price_multiplier > 0)
);

-- Create index on seasonal_rates for date-based lookups
CREATE INDEX idx_seasonal_rates_property_dates ON public.seasonal_rates(property_id, start_date, end_date);

-- Enable RLS on seasonal_rates
ALTER TABLE public.seasonal_rates ENABLE ROW LEVEL SECURITY;

-- Seasonal rates policies
CREATE POLICY "Anyone can view seasonal rates"
ON public.seasonal_rates FOR SELECT
USING (true);

CREATE POLICY "Admins can insert seasonal rates"
ON public.seasonal_rates FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update seasonal rates"
ON public.seasonal_rates FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete seasonal rates"
ON public.seasonal_rates FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create special_offers table
CREATE TABLE public.special_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_offer_date_range CHECK (valid_until >= valid_from)
);

-- Create index on special_offers for active offers lookup
CREATE INDEX idx_special_offers_active ON public.special_offers(property_id, is_active, valid_from, valid_until);

-- Enable RLS on special_offers
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- Special offers policies
CREATE POLICY "Anyone can view active special offers"
ON public.special_offers FOR SELECT
USING (is_active = true AND valid_from <= CURRENT_DATE AND valid_until >= CURRENT_DATE);

CREATE POLICY "Admins can view all special offers"
ON public.special_offers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert special offers"
ON public.special_offers FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update special offers"
ON public.special_offers FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete special offers"
ON public.special_offers FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on seasonal_rates
CREATE TRIGGER update_seasonal_rates_updated_at
BEFORE UPDATE ON public.seasonal_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on special_offers
CREATE TRIGGER update_special_offers_updated_at
BEFORE UPDATE ON public.special_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();