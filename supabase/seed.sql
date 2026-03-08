-- =============================================================
-- Arivia Villas — Starter Seed Data
-- Run with: supabase db seed (or paste into Supabase SQL editor)
-- All statements use ON CONFLICT DO NOTHING so it is safe to
-- re-run against an existing database.
-- =============================================================

-- ----------------------------
-- Brand Settings (one row)
-- ----------------------------
INSERT INTO public.brand_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ----------------------------
-- Exit Intent Settings (one row)
-- ----------------------------
INSERT INTO public.exit_intent_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ----------------------------
-- Navigation Items
-- ----------------------------
INSERT INTO public.navigation_items (placement, label, path, sort_order, priority) VALUES
  ('header', 'Properties',   '/properties',   0, true),
  ('header', 'Destinations', '/destinations', 1, false),
  ('header', 'Experiences',  '/experiences',  2, true),
  ('header', 'Blog',         '/blog',         3, false),
  ('header', 'About',        '/about',        4, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.navigation_items (placement, label, path, icon, sort_order) VALUES
  ('hero_quicknav', 'Destinations', '/destinations', 'MapPin',   0),
  ('hero_quicknav', 'Properties',   '/properties',   'Home',     1),
  ('hero_quicknav', 'Experiences',  '/experiences',  'Sparkles', 2),
  ('hero_quicknav', 'Stories',      '/blog',         'BookOpen', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.navigation_items (placement, label, path, sort_order) VALUES
  ('footer_explore',  'All Properties', '/properties',   0),
  ('footer_explore',  'Destinations',   '/destinations', 1),
  ('footer_explore',  'Experiences',    '/experiences',  2),
  ('footer_explore',  'Blog',           '/blog',         3),
  ('footer_company',  'About Us',       '/about',        0),
  ('footer_company',  'Contact',        '/contact',      1),
  ('footer_company',  'Privacy Policy', '/privacy',      2),
  ('footer_company',  'Terms of Service', '/terms',      3)
ON CONFLICT DO NOTHING;

-- ----------------------------
-- Hero Settings
-- ----------------------------
INSERT INTO public.hero_settings (key, value) VALUES
  ('show_search_bar',      'true'),
  ('show_featured_villa',  'true'),
  ('featured_property_id', 'auto'),
  ('show_quick_nav',       'true'),
  ('hero_background_image', '')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------
-- Section Display Settings
-- ----------------------------
INSERT INTO public.section_display_settings (page_slug, section_key, layout_mode, columns) VALUES
  ('home',         'properties',   'grid', 3),
  ('home',         'destinations', 'grid', 3),
  ('home',         'experiences',  'grid', 4),
  ('home',         'blog',         'grid', 3),
  ('properties',   'grid',         'grid', 4),
  ('destinations', 'grid',         'grid', 3),
  ('experiences',  'grid',         'grid', 3),
  ('about',        'values',       'grid', 4)
ON CONFLICT DO NOTHING;

-- ----------------------------
-- Amenities
-- ----------------------------
INSERT INTO public.amenities (slug, name, description, icon, category) VALUES
  -- Essentials
  ('wifi',               'WiFi',               'High-speed wireless internet throughout the property',        'Wifi',              'Essentials'),
  ('air-conditioning',   'Air Conditioning',   'Climate control for your comfort in every room',             'Wind',              'Essentials'),
  ('heating',            'Central Heating',    'Warm and cozy atmosphere during cooler months',              'Flame',             'Essentials'),
  ('parking',            'Free Parking',       'Secure private parking for your vehicles',                   'Car',               'Essentials'),
  ('kitchen',            'Full Kitchen',       'Fully equipped kitchen with modern appliances',              'ChefHat',           'Essentials'),
  ('laundry',            'Laundry',            'In-unit washer and dryer for your convenience',              'WashingMachine',    'Essentials'),
  -- Wellness & Relaxation
  ('pool',               'Swimming Pool',      'Refreshing private pool for relaxation and exercise',        'Waves',             'Wellness'),
  ('infinity-pool',      'Infinity Pool',      'Stunning infinity edge pool with panoramic views',           'Waves',             'Wellness'),
  ('spa',                'Spa & Wellness',     'Full-service spa with massage and treatment rooms',          'Sparkles',          'Wellness'),
  ('hot-tub',            'Hot Tub',            'Private jacuzzi for ultimate relaxation under the stars',   'Bath',              'Wellness'),
  ('sauna',              'Sauna',              'Traditional sauna for detox and relaxation',                 'Thermometer',       'Wellness'),
  ('steam-room',         'Steam Room',         'Luxurious steam room for deep relaxation',                  'Cloud',             'Wellness'),
  ('gym',                'Fitness Center',     'State-of-the-art gym with premium equipment',               'Dumbbell',          'Wellness'),
  ('yoga-deck',          'Yoga Deck',          'Dedicated outdoor space with yoga mats and equipment',      'Leaf',              'Wellness'),
  ('meditation-room',    'Meditation Room',    'Quiet sanctuary for mindfulness and meditation',             'Heart',             'Wellness'),
  ('massage-room',       'Massage Room',       'Private space for in-villa massage treatments',             'Hand',              'Wellness'),
  -- Views & Location
  ('ocean-view',         'Ocean View',         'Breathtaking panoramic views of the ocean',                 'Ship',              'Views'),
  ('mountain-view',      'Mountain View',      'Stunning backdrop of majestic mountains',                   'Mountain',          'Views'),
  ('beach-access',       'Beach Access',       'Direct private access to pristine sandy beach',             'Umbrella',          'Views'),
  ('lake-view',          'Lake View',          'Serene views overlooking tranquil lake waters',             'Waves',             'Views'),
  ('garden-view',        'Garden View',        'Lush garden landscapes from your windows',                  'Flower2',           'Views'),
  ('sunset-view',        'Sunset View',        'West-facing for spectacular sunset experiences',            'Sunrise',           'Views'),
  -- Outdoor Spaces
  ('garden',             'Private Garden',     'Beautifully landscaped private garden oasis',               'Flower2',           'Outdoors'),
  ('terrace',            'Terrace',            'Spacious outdoor terrace for dining and lounging',          'TreeDeciduous',     'Outdoors'),
  ('balcony',            'Balcony',            'Private balcony with comfortable seating',                  'Home',              'Outdoors'),
  ('rooftop-terrace',    'Rooftop Terrace',    'Exclusive rooftop space with 360-degree views',             'Building',          'Outdoors'),
  ('private-beach',      'Private Beach',      'Exclusive beach area reserved for guests',                  'Umbrella',          'Outdoors'),
  ('tennis-court',       'Tennis Court',       'Professional-grade tennis court on premises',               'Circle',            'Outdoors'),
  ('golf-access',        'Golf Access',        'Nearby championship golf course access',                    'Flag',              'Outdoors'),
  ('hiking-trails',      'Hiking Trails',      'Direct access to scenic hiking paths',                     'TreePine',          'Outdoors'),
  -- Premium Services
  ('concierge',          '24/7 Concierge',     'Round-the-clock personal concierge service',                'Bell',              'Services'),
  ('butler-service',     'Butler Service',     'Dedicated personal butler at your disposal',                'Crown',             'Services'),
  ('private-chef',       'Private Chef',       'Personal chef for customized dining experiences',           'UtensilsCrossed',   'Services'),
  ('housekeeping',       'Daily Housekeeping', 'Professional daily cleaning and turndown service',          'Sparkles',          'Services'),
  ('room-service',       'Room Service',       'In-room dining available around the clock',                 'UtensilsCrossed',   'Services'),
  ('airport-transfer',   'Airport Transfer',   'Luxury vehicle pickup and dropoff service',                 'Plane',             'Services'),
  -- Entertainment
  ('fireplace',          'Fireplace',          'Cozy fireplace for atmospheric evenings',                   'Flame',             'Entertainment'),
  ('cinema-room',        'Cinema Room',        'Private home theater with premium audio-visual',            'Clapperboard',      'Entertainment'),
  ('game-room',          'Game Room',          'Entertainment space with games and activities',             'Gamepad2',          'Entertainment'),
  ('music-system',       'Music System',       'High-fidelity sound system throughout',                    'Music',             'Entertainment'),
  ('library',            'Library',            'Curated book collection in a quiet reading space',         'BookOpen',          'Entertainment'),
  ('restaurant',         'On-site Restaurant', 'Fine dining restaurant within the property',                'UtensilsCrossed',   'Entertainment'),
  ('bar',                'Bar & Lounge',       'Sophisticated bar with premium spirits selection',          'Wine',              'Entertainment'),
  ('wine-cellar',        'Wine Cellar',        'Temperature-controlled cellar with fine wines',             'Wine',              'Entertainment'),
  -- Technology
  ('smart-home',         'Smart Home',         'Automated lighting, climate, and entertainment control',    'Smartphone',        'Technology'),
  ('ev-charging',        'EV Charging',        'Electric vehicle charging station available',               'Zap',               'Technology'),
  ('high-speed-internet','High-Speed Internet','Fiber optic internet for seamless connectivity',            'Wifi',              'Technology'),
  ('home-office',        'Home Office',        'Dedicated workspace with ergonomic setup',                  'Monitor',           'Technology'),
  -- Family & Accessibility
  ('pet-friendly',       'Pet Friendly',       'Welcoming environment for your furry companions',           'PawPrint',          'Family'),
  ('kids-friendly',      'Kids Friendly',      'Child-safe environment with kids amenities',                'Baby',              'Family'),
  ('wheelchair-accessible','Wheelchair Accessible','Full accessibility for mobility-impaired guests',       'Accessibility',     'Accessibility'),
  -- Luxury Extras
  ('helipad',            'Helipad',            'Private helicopter landing pad on premises',                'Plane',             'Luxury'),
  ('yacht-access',       'Yacht Access',       'Private dock with yacht mooring available',                 'Ship',              'Luxury'),
  ('private-island',     'Private Island',     'Exclusive island retreat for ultimate privacy',             'Palmtree',          'Luxury')
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------
-- Destinations
-- ----------------------------
INSERT INTO public.destinations (name, slug, country, description, long_description, highlights, best_time_to_visit, climate, is_featured, status)
VALUES (
  'Santorini',
  'santorini',
  'Greece',
  'A stunning volcanic island in the Aegean Sea, famous for its dramatic views, whitewashed buildings, and spectacular sunsets.',
  'Santorini is one of the Cyclades islands in the Aegean Sea, shaped by a volcanic eruption that formed its rugged landscape. The island is famous for its stunning caldera views, blue-domed churches, and villages perched on dramatic cliffs. The two main towns, Fira and Oia, are known for their white-washed cubic houses, winding lanes, and breathtaking sunset views. Beyond the famous vistas, Santorini offers unique beaches with red, black, and white volcanic sand, ancient ruins at Akrotiri, and exceptional local wines produced from grapes grown in the island''s volcanic soil.',
  ARRAY[
    'Iconic blue-domed churches and whitewashed architecture',
    'World-famous sunsets in Oia',
    'Unique volcanic beaches',
    'Award-winning local wines',
    'Ancient ruins of Akrotiri',
    'Stunning caldera views'
  ],
  'Late April to early November, with peak season in July and August',
  'Mediterranean climate with hot, dry summers and mild, wet winters',
  true,
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------
-- Blog Categories
-- ----------------------------
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Travel Tips',       'travel-tips',       'Expert advice for the discerning traveler'),
  ('Destination Guides','destination-guides', 'In-depth guides to our featured locations'),
  ('Lifestyle',         'lifestyle',          'Luxury living and experiences')
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------
-- Blog Authors
-- ----------------------------
INSERT INTO public.blog_authors (name, slug, bio, is_active) VALUES
  (
    'Arivia Editorial',
    'arivia-editorial',
    'Our editorial team curates the finest travel insights, destination guides, and luxury living inspiration.',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------
-- Cancellation Policies
-- ----------------------------
INSERT INTO public.cancellation_policies (name, description, color, is_default, is_active, rules) VALUES
  (
    'Flexible',
    'Full refund up to 7 days before check-in. 50% refund 3–7 days before. No refund within 3 days.',
    'green', true, true,
    '[{"daysBeforeCheckIn": 7, "refundPercentage": 100}, {"daysBeforeCheckIn": 3, "refundPercentage": 50}, {"daysBeforeCheckIn": 0, "refundPercentage": 0}]'::jsonb
  ),
  (
    'Moderate',
    'Full refund up to 14 days before check-in. 50% refund 7–14 days before. No refund within 7 days.',
    'yellow', true, true,
    '[{"daysBeforeCheckIn": 14, "refundPercentage": 100}, {"daysBeforeCheckIn": 7, "refundPercentage": 50}, {"daysBeforeCheckIn": 0, "refundPercentage": 0}]'::jsonb
  ),
  (
    'Strict',
    'Full refund up to 30 days before check-in. 50% refund 14–30 days before. No refund within 14 days.',
    'orange', true, true,
    '[{"daysBeforeCheckIn": 30, "refundPercentage": 100}, {"daysBeforeCheckIn": 14, "refundPercentage": 50}, {"daysBeforeCheckIn": 0, "refundPercentage": 0}]'::jsonb
  ),
  (
    'Non-Refundable',
    'This rate is non-refundable. No refund at any time after booking.',
    'red', true, true,
    '[{"daysBeforeCheckIn": 0, "refundPercentage": 0}]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ----------------------------
-- Testimonials
-- ----------------------------
INSERT INTO public.testimonials (platform, text, author, location, rating, display_order) VALUES
  (
    'booking',
    'The villa was a dream — waking up to the caldera view, the private infinity pool catching the morning light. The team arranged a sunset sailing trip that became the highlight of our entire year.',
    'Elena & Marco',
    'Santorini, August 2025',
    5, 1
  ),
  (
    'tripadvisor',
    'From the moment we arrived, everything was perfect. The villa exceeded our expectations in every way. The concierge service was exceptional and truly made our stay unforgettable.',
    'Sarah M.',
    'Tuscany, June 2025',
    5, 2
  ),
  (
    'booking',
    'A truly luxurious experience. The attention to detail, the private pool, the location — everything was world-class. We''ve already booked our return trip.',
    'James K.',
    'Bali, September 2025',
    5, 3
  )
ON CONFLICT DO NOTHING;
