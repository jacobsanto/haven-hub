-- Create exit intent settings table (singleton pattern)
CREATE TABLE exit_intent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT true,
  delay_seconds INTEGER DEFAULT 1,
  cooldown_days INTEGER DEFAULT 7,
  discount_offer_enabled BOOLEAN DEFAULT true,
  discount_percent INTEGER DEFAULT 10,
  price_drop_offer_enabled BOOLEAN DEFAULT true,
  headline TEXT DEFAULT 'Don''t miss out on your dream getaway',
  subheadline TEXT DEFAULT 'Choose an exclusive offer just for you',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE exit_intent_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can manage exit intent settings"
ON exit_intent_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read exit intent settings"
ON exit_intent_settings
FOR SELECT
USING (true);

-- Insert default settings row
INSERT INTO exit_intent_settings (id) VALUES (gen_random_uuid());