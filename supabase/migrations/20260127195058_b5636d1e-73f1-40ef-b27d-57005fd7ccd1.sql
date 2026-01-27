-- Create amenities table for dynamic amenity management
CREATE TABLE public.amenities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    icon text NOT NULL DEFAULT 'Sparkles',
    category text NOT NULL DEFAULT 'General',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active amenities"
ON public.amenities
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all amenities"
ON public.amenities
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert amenities"
ON public.amenities
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update amenities"
ON public.amenities
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete amenities"
ON public.amenities
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_amenities_updated_at
BEFORE UPDATE ON public.amenities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with enhanced amenities data
INSERT INTO public.amenities (slug, name, description, icon, category) VALUES
-- Essentials
('wifi', 'WiFi', 'High-speed wireless internet throughout the property', 'Wifi', 'Essentials'),
('air-conditioning', 'Air Conditioning', 'Climate control for your comfort in every room', 'Wind', 'Essentials'),
('heating', 'Central Heating', 'Warm and cozy atmosphere during cooler months', 'Flame', 'Essentials'),
('parking', 'Free Parking', 'Secure private parking for your vehicles', 'Car', 'Essentials'),
('kitchen', 'Full Kitchen', 'Fully equipped kitchen with modern appliances', 'ChefHat', 'Essentials'),
('laundry', 'Laundry', 'In-unit washer and dryer for your convenience', 'WashingMachine', 'Essentials'),

-- Wellness & Relaxation
('pool', 'Swimming Pool', 'Refreshing private pool for relaxation and exercise', 'Waves', 'Wellness'),
('infinity-pool', 'Infinity Pool', 'Stunning infinity edge pool with panoramic views', 'Waves', 'Wellness'),
('spa', 'Spa & Wellness', 'Full-service spa with massage and treatment rooms', 'Sparkles', 'Wellness'),
('hot-tub', 'Hot Tub', 'Private jacuzzi for ultimate relaxation under the stars', 'Bath', 'Wellness'),
('sauna', 'Sauna', 'Traditional sauna for detox and relaxation', 'Thermometer', 'Wellness'),
('steam-room', 'Steam Room', 'Luxurious steam room for deep relaxation', 'Cloud', 'Wellness'),
('gym', 'Fitness Center', 'State-of-the-art gym with premium equipment', 'Dumbbell', 'Wellness'),
('yoga-deck', 'Yoga Deck', 'Dedicated outdoor space with yoga mats and equipment', 'Leaf', 'Wellness'),
('meditation-room', 'Meditation Room', 'Quiet sanctuary for mindfulness and meditation', 'Heart', 'Wellness'),
('massage-room', 'Massage Room', 'Private space for in-villa massage treatments', 'Hand', 'Wellness'),

-- Views & Location
('ocean-view', 'Ocean View', 'Breathtaking panoramic views of the ocean', 'Ship', 'Views'),
('mountain-view', 'Mountain View', 'Stunning backdrop of majestic mountains', 'Mountain', 'Views'),
('beach-access', 'Beach Access', 'Direct private access to pristine sandy beach', 'Umbrella', 'Views'),
('lake-view', 'Lake View', 'Serene views overlooking tranquil lake waters', 'Waves', 'Views'),
('garden-view', 'Garden View', 'Lush garden landscapes from your windows', 'Flower2', 'Views'),
('sunset-view', 'Sunset View', 'West-facing for spectacular sunset experiences', 'Sunrise', 'Views'),

-- Outdoor Spaces
('garden', 'Private Garden', 'Beautifully landscaped private garden oasis', 'Flower2', 'Outdoors'),
('terrace', 'Terrace', 'Spacious outdoor terrace for dining and lounging', 'TreeDeciduous', 'Outdoors'),
('balcony', 'Balcony', 'Private balcony with comfortable seating', 'Home', 'Outdoors'),
('rooftop-terrace', 'Rooftop Terrace', 'Exclusive rooftop space with 360-degree views', 'Building', 'Outdoors'),
('private-beach', 'Private Beach', 'Exclusive beach area reserved for guests', 'Umbrella', 'Outdoors'),
('tennis-court', 'Tennis Court', 'Professional-grade tennis court on premises', 'Circle', 'Outdoors'),
('golf-access', 'Golf Access', 'Nearby championship golf course access', 'Flag', 'Outdoors'),
('hiking-trails', 'Hiking Trails', 'Direct access to scenic hiking paths', 'TreePine', 'Outdoors'),

-- Premium Services
('concierge', '24/7 Concierge', 'Round-the-clock personal concierge service', 'Bell', 'Services'),
('butler-service', 'Butler Service', 'Dedicated personal butler at your disposal', 'Crown', 'Services'),
('private-chef', 'Private Chef', 'Personal chef for customized dining experiences', 'UtensilsCrossed', 'Services'),
('housekeeping', 'Daily Housekeeping', 'Professional daily cleaning and turndown service', 'Sparkles', 'Services'),
('room-service', 'Room Service', 'In-room dining available around the clock', 'UtensilsCrossed', 'Services'),
('airport-transfer', 'Airport Transfer', 'Luxury vehicle pickup and dropoff service', 'Plane', 'Services'),

-- Entertainment
('fireplace', 'Fireplace', 'Cozy fireplace for atmospheric evenings', 'Flame', 'Entertainment'),
('cinema-room', 'Cinema Room', 'Private home theater with premium audio-visual', 'Clapperboard', 'Entertainment'),
('game-room', 'Game Room', 'Entertainment space with games and activities', 'Gamepad2', 'Entertainment'),
('music-system', 'Music System', 'High-fidelity sound system throughout', 'Music', 'Entertainment'),
('library', 'Library', 'Curated book collection in a quiet reading space', 'BookOpen', 'Entertainment'),
('restaurant', 'On-site Restaurant', 'Fine dining restaurant within the property', 'UtensilsCrossed', 'Entertainment'),
('bar', 'Bar & Lounge', 'Sophisticated bar with premium spirits selection', 'Wine', 'Entertainment'),
('wine-cellar', 'Wine Cellar', 'Temperature-controlled cellar with fine wines', 'Wine', 'Entertainment'),

-- Technology
('smart-home', 'Smart Home', 'Automated lighting, climate, and entertainment control', 'Smartphone', 'Technology'),
('ev-charging', 'EV Charging', 'Electric vehicle charging station available', 'Zap', 'Technology'),
('high-speed-internet', 'High-Speed Internet', 'Fiber optic internet for seamless connectivity', 'Wifi', 'Technology'),
('home-office', 'Home Office', 'Dedicated workspace with ergonomic setup', 'Monitor', 'Technology'),

-- Family & Accessibility
('pet-friendly', 'Pet Friendly', 'Welcoming environment for your furry companions', 'PawPrint', 'Family'),
('kids-friendly', 'Kids Friendly', 'Child-safe environment with kids amenities', 'Baby', 'Family'),
('wheelchair-accessible', 'Wheelchair Accessible', 'Full accessibility for mobility-impaired guests', 'Accessibility', 'Accessibility'),

-- Luxury Extras
('helipad', 'Helipad', 'Private helicopter landing pad on premises', 'Plane', 'Luxury'),
('yacht-access', 'Yacht Access', 'Private dock with yacht mooring available', 'Ship', 'Luxury'),
('private-island', 'Private Island', 'Exclusive island retreat for ultimate privacy', 'Palmtree', 'Luxury');