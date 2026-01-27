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
  // New fields
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

export interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  property?: Property;
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
