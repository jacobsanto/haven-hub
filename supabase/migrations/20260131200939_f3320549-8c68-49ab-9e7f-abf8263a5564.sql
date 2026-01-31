-- Create promotional_campaigns table for site-wide pop-up offers
CREATE TABLE public.promotional_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  
  -- Call to action
  cta_text TEXT DEFAULT 'Claim Offer',
  cta_link TEXT,
  
  -- Discount configuration
  discount_method TEXT NOT NULL DEFAULT 'coupon',
  coupon_id UUID REFERENCES public.coupons_promos(id) ON DELETE SET NULL,
  auto_discount_percent INTEGER,
  
  -- Scheduling
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Display rules
  trigger_type TEXT NOT NULL DEFAULT 'entry',
  trigger_delay_seconds INTEGER DEFAULT 0,
  show_on_mobile BOOLEAN DEFAULT true,
  
  -- Targeting
  applicable_pages TEXT[] DEFAULT '{}',
  applicable_properties UUID[] DEFAULT '{}',
  
  -- Control
  priority INTEGER DEFAULT 0,
  max_impressions INTEGER,
  impressions_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient active campaign queries
CREATE INDEX idx_promo_campaigns_active ON public.promotional_campaigns 
  (is_active, starts_at, ends_at, priority DESC);

-- Enable RLS
ALTER TABLE public.promotional_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin can manage all campaigns
CREATE POLICY "Admin can manage promotional campaigns"
ON public.promotional_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can read active campaigns within their schedule
CREATE POLICY "Public can read active scheduled campaigns"
ON public.promotional_campaigns
FOR SELECT
USING (
  is_active = true 
  AND starts_at <= now() 
  AND ends_at >= now()
  AND (max_impressions IS NULL OR impressions_count < max_impressions)
);

-- Trigger for updated_at
CREATE TRIGGER update_promotional_campaigns_updated_at
BEFORE UPDATE ON public.promotional_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();