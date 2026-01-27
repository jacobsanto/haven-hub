// PMS Adapter Types - Abstracted interface for any PMS integration

export interface PMSProperty {
  id: string;
  externalId: string;
  name: string;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  images: string[];
  amenities: string[];
  location: {
    city: string;
    region?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface PMSAvailability {
  propertyId: string;
  date: string; // YYYY-MM-DD
  available: boolean;
  minStay?: number;
  checkInAllowed?: boolean;
  checkOutAllowed?: boolean;
}

export interface PMSRate {
  propertyId: string;
  date: string; // YYYY-MM-DD
  baseRate: number;
  currency: string;
  minStay: number;
}

export interface PMSFee {
  id: string;
  name: string;
  type: 'fixed' | 'percentage' | 'per_night' | 'per_guest' | 'per_guest_per_night';
  amount: number;
  isTax: boolean;
  isMandatory: boolean;
}

export interface PMSBookingRequest {
  propertyId: string;
  externalPropertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  totalAmount: number;
  currency: string;
  notes?: string;
  addons?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PMSBookingResponse {
  success: boolean;
  externalBookingId?: string;
  confirmationCode?: string;
  error?: string;
}

export interface PMSCancellationRequest {
  externalBookingId: string;
  reason?: string;
}

export interface PMSCancellationResponse {
  success: boolean;
  refundAmount?: number;
  error?: string;
}

export interface PMSSyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errors?: string[];
}

// Abstract PMS Adapter Interface
export interface PMSAdapter {
  // Connection
  testConnection(): Promise<boolean>;
  
  // Properties
  fetchProperties(): Promise<PMSProperty[]>;
  fetchProperty(externalId: string): Promise<PMSProperty | null>;
  
  // Availability & Rates
  fetchAvailability(
    externalPropertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PMSAvailability[]>;
  
  fetchRates(
    externalPropertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PMSRate[]>;
  
  fetchFees(externalPropertyId: string): Promise<PMSFee[]>;
  
  // Bookings
  createBooking(request: PMSBookingRequest): Promise<PMSBookingResponse>;
  cancelBooking(request: PMSCancellationRequest): Promise<PMSCancellationResponse>;
  
  // Sync
  syncAll(): Promise<PMSSyncResult>;
  syncAvailability(externalPropertyId: string): Promise<PMSSyncResult>;
  syncRates(externalPropertyId: string): Promise<PMSSyncResult>;
}
