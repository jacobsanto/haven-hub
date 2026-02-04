// Type definitions for our hospitality platform
// These extend the auto-generated Supabase types

export type PropertyStatus = 'active' | 'draft' | 'archived';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type AppRole = 'admin' | 'user';
export type PropertyType = 'villa' | 'apartment' | 'estate' | 'cottage' | 'penthouse';

// Room configuration for property
export interface RoomConfig {
  type: 'bedroom' | 'bathroom' | 'living' | 'kitchen' | 'dining' | 'office';
  name: string;
  beds?: { type: 'king' | 'queen' | 'double' | 'twin' | 'sofa'; count: number }[];
  features?: string[];
}

// Nearby attraction for neighborhood info
export interface NearbyAttraction {
  name: string;
  type: 'restaurant' | 'beach' | 'attraction' | 'shopping' | 'airport' | 'transport' | 'nature';
  distance: string;
  icon?: string;
}

export interface Property {
  id: string;
  name: string;
  display_name: string | null;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  gallery: string[];
  city: string;
  region: string | null;
  country: string;
  amenities: string[];
  base_price: number;
  max_guests: number;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
  destination_id: string | null;
  video_url: string | null;
  virtual_tour_url: string | null;
  instant_booking: boolean;
  highlights: string[];
  rooms: RoomConfig[];
  neighborhood_description: string | null;
  nearby_attractions: NearbyAttraction[];
  house_rules: string[];
  cancellation_policy: string | null;
  pet_policy: string | null;
  bedrooms: number;
  bathrooms: number;
  property_type: PropertyType;
  // New timing/timezone fields
  timezone: string;
  check_in_time: string;
  check_out_time: string;
}

export interface SeasonalRate {
  id: string;
  property_id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  nightly_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface SpecialOffer {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type PMSSyncStatus = 'pending' | 'synced' | 'failed';
export type BookingSource = 'direct' | 'booking_com' | 'airbnb' | 'expedia' | 'vrbo' | 'manual';

export interface Booking {
  id: string;
  property_id: string;
  booking_reference: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_country: string | null;
  check_in: string;
  check_out: string;
  check_in_time: string | null;
  check_out_time: string | null;
  nights: number;
  guests: number;
  adults: number;
  children: number;
  total_price: number;
  status: BookingStatus;
  source: BookingSource;
  payment_status: PaymentStatus;
  special_requests: string | null;
  external_booking_id: string | null;
  pms_sync_status: PMSSyncStatus;
  pms_synced_at: string | null;
  created_at: string;
}

export interface BookingWithProperty extends Booking {
  property: {
    id: string;
    name: string;
    slug: string;
    hero_image_url: string | null;
  };
}

export interface BookingPriceBreakdown {
  id: string;
  booking_id: string;
  line_type: 'accommodation' | 'addon' | 'fee' | 'tax' | 'discount';
  label: string;
  amount: number;
  quantity: number;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SecurityDeposit {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'held' | 'released' | 'claimed';
  held_at: string | null;
  released_at: string | null;
  stripe_charge_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Availability {
  id: string;
  property_id: string;
  date: string;
  available: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

// Booking-related types
export interface BookingPayment {
  id: string;
  booking_id: string;
  payment_type: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  due_date: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BookingAddon {
  id: string;
  booking_id: string;
  addon_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  guest_count: number | null;
  scheduled_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  addon?: {
    name: string;
    category: string;
  };
}

// Search and filter types
export interface PropertySearchParams {
  location?: string;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: PropertyType;
  instantBooking?: boolean;
  destinationId?: string;
}

export interface BookingFormData {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
}
