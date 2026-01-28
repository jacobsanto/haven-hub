-- Create cancellation_policies table
CREATE TABLE public.cancellation_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'yellow',
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;

-- Admin can manage all policies
CREATE POLICY "Admin can manage cancellation policies"
ON public.cancellation_policies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can read active policies
CREATE POLICY "Public can read active policies"
ON public.cancellation_policies
FOR SELECT
USING (is_active = true);

-- Add updated_at trigger
CREATE TRIGGER update_cancellation_policies_updated_at
  BEFORE UPDATE ON public.cancellation_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default policies (4 presets)
INSERT INTO public.cancellation_policies (name, description, color, is_default, is_active, rules) VALUES
(
  'Flexible',
  'Full refund up to 7 days before check-in. 50% refund 3-7 days before. No refund within 3 days.',
  'green',
  true,
  true,
  '[{"daysBeforeCheckIn": 7, "refundPercentage": 100}, {"daysBeforeCheckIn": 3, "refundPercentage": 50}, {"daysBeforeCheckIn": 0, "refundPercentage": 0}]'::jsonb
),
(
  'Moderate',
  'Full refund up to 14 days before check-in. 50% refund 7-14 days before. No refund within 7 days.',
  'yellow',
  true,
  true,
  '[{"daysBeforeCheckIn": 14, "refundPercentage": 100}, {"daysBeforeCheckIn": 7, "refundPercentage": 50}, {"daysBeforeCheckIn": 0, "refundPercentage": 0}]'::jsonb
),
(
  'Strict',
  'Full refund up to 30 days before check-in. 50% refund 14-30 days before. No refund within 14 days.',
  'orange',
  true,
  true,
  '[{"daysBeforeCheckIn": 30, "refundPercentage": 100}, {"daysBeforeCheckIn": 14, "refundPercentage": 50}, {"daysBeforeCheckIn": 0, "refundPercentage": 0}]'::jsonb
),
(
  'Non-Refundable',
  'This rate is non-refundable. No refund at any time after booking.',
  'red',
  true,
  true,
  '[{"daysBeforeCheckIn": 0, "refundPercentage": 0}]'::jsonb
);