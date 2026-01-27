// Type definitions for our hospitality platform
// These extend the auto-generated Supabase types

export type PropertyStatus = 'active' | 'draft' | 'archived';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type AppRole = 'admin' | 'user';

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
