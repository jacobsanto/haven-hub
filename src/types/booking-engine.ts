// Booking Engine Types - Core types for the direct booking system

export type PaymentType = 'full' | 'deposit';

export interface RatePlan {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  rateType: 'standard' | 'member' | 'promotional' | 'long_stay';
  baseRate: number;
  minStay: number;
  maxStay?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  memberTierRequired?: string;
}

export interface Fee {
  id: string;
  propertyId?: string;
  name: string;
  feeType: 'fixed' | 'percentage' | 'per_night' | 'per_guest' | 'per_guest_per_night';
  amount: number;
  isTax: boolean;
  isMandatory: boolean;
  appliesTo: 'all' | 'base_rate' | 'addons';
}

export interface Addon {
  id: string;
  propertyId?: string;
  name: string;
  description?: string;
  category: 'transfer' | 'food' | 'experience' | 'service' | 'package';
  price: number;
  priceType: 'fixed' | 'per_person' | 'per_night' | 'per_person_per_night';
  maxQuantity?: number;
  requiresLeadTimeHours?: number;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SelectedAddon {
  addon: Addon;
  quantity: number;
  guestCount?: number;
  scheduledDate?: string;
  calculatedPrice: number;
}

export interface CouponPromo {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'free_addon';
  discountValue: number;
  minNights?: number;
  minBookingValue?: number;
  maxUses?: number;
  usesCount: number;
  validFrom: string;
  validUntil: string;
  applicableProperties?: string[];
  stackable: boolean;
  isActive: boolean;
}

export interface PriceBreakdown {
  baseRate: number;
  nights: number;
  accommodationTotal: number;
  addonsTotal: number;
  feesTotal: number;
  taxesTotal: number;
  discountAmount: number;
  discountCode?: string;
  subtotal: number;
  total: number;
  depositAmount?: number;
  balanceAmount?: number;
  currency: string;
  lineItems: PriceLineItem[];
}

export interface PriceLineItem {
  label: string;
  amount: number;
  type: 'accommodation' | 'addon' | 'fee' | 'tax' | 'discount';
  details?: string;
}

export interface BookingGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  specialRequests?: string;
}

export interface CheckoutHold {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  sessionId: string;
  expiresAt: string;
  released: boolean;
}

export interface BookingRequest {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestInfo: BookingGuest;
  selectedAddons: SelectedAddon[];
  couponCode?: string;
  priceBreakdown: PriceBreakdown;
  paymentType: PaymentType;
  paymentIntentId?: string;
  holdId?: string;
  marketingConsent: boolean;
  termsAccepted: boolean;
}

export interface BookingPayment {
  id: string;
  bookingId: string;
  paymentType: 'deposit' | 'balance' | 'full' | 'refund' | 'addon';
  amount: number;
  currency: string;
  stripePaymentIntentId?: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod?: string;
  paidAt?: string;
  dueDate?: string;
}

export interface DepositConfig {
  enabled: boolean;
  percentageOfTotal: number;
  minimumAmount: number;
  daysBeforeArrival: number; // Balance due X days before
}

export interface AvailabilityCalendarDay {
  date: string;
  available: boolean;
  price?: number;
  minStay?: number;
  checkInAllowed: boolean;
  checkOutAllowed: boolean;
  isBlocked?: boolean;
  blockReason?: string;
}

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  propertyType?: string;
  instantBooking?: boolean;
}

export interface SearchResult {
  propertyId: string;
  name: string;
  slug: string;
  heroImage?: string;
  location: {
    city: string;
    region?: string;
    country: string;
  };
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  basePrice: number;
  totalPrice?: number;
  pricePerNight?: number;
  instantBooking: boolean;
  amenities: string[];
  rating?: number;
  reviewCount?: number;
  highlights: string[];
}
