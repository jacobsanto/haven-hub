-- Add base_currency column to brand_settings table
ALTER TABLE brand_settings
ADD COLUMN base_currency TEXT NOT NULL DEFAULT 'EUR';