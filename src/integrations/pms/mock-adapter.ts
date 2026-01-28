// Mock PMS Adapter - Simulates Tokeet/AdvanceCM for development
// This will be replaced with real TokeetAdvanceCMAdapter when credentials are available

import { 
  PMSAdapter, 
  PMSProperty, 
  PMSAvailability, 
  PMSRate, 
  PMSFee,
  PMSBookingRequest,
  PMSBookingResponse,
  PMSCancellationRequest,
  PMSCancellationResponse,
  PMSSyncResult
} from './types';
import { addDays, format, eachDayOfInterval, parseISO, isWeekend } from 'date-fns';

// Mock property data for Santorini villas
const MOCK_PROPERTIES: PMSProperty[] = [
  {
    id: 'villa-caldera-1',
    externalId: 'tok_123456',
    name: 'Villa Caldera Sunset',
    description: 'Perched on the cliffs of Oia, this stunning villa offers unobstructed caldera views, a private infinity pool, and direct access to the famous Santorini sunset.',
    bedrooms: 4,
    bathrooms: 4,
    maxGuests: 8,
    images: [
      '/placeholder.svg',
    ],
    amenities: ['Private Pool', 'Sea View', 'Air Conditioning', 'WiFi', 'Kitchen', 'Jacuzzi', 'Parking', 'Concierge'],
    location: {
      city: 'Oia',
      region: 'Santorini',
      country: 'Greece',
      coordinates: { lat: 36.4618, lng: 25.3753 }
    }
  },
  {
    id: 'villa-aegean-2',
    externalId: 'tok_234567',
    name: 'Villa Aegean Blue',
    description: 'A luxurious cave-style villa in Fira with traditional Cycladic architecture, featuring a heated plunge pool and panoramic sea views.',
    bedrooms: 3,
    bathrooms: 3,
    maxGuests: 6,
    images: [
      '/placeholder.svg',
    ],
    amenities: ['Heated Pool', 'Sea View', 'Air Conditioning', 'WiFi', 'Kitchen', 'BBQ', 'Wine Cellar'],
    location: {
      city: 'Fira',
      region: 'Santorini',
      country: 'Greece',
      coordinates: { lat: 36.4166, lng: 25.4315 }
    }
  },
  {
    id: 'villa-santorini-3',
    externalId: 'tok_345678',
    name: 'Villa Santorini Dreams',
    description: 'An exclusive 5-bedroom estate in Imerovigli with a private chef, spa facilities, and the most spectacular caldera views on the island.',
    bedrooms: 5,
    bathrooms: 5,
    maxGuests: 10,
    images: [
      '/placeholder.svg',
    ],
    amenities: ['Private Pool', 'Spa', 'Gym', 'Sea View', 'Air Conditioning', 'WiFi', 'Chef Service', 'Helipad'],
    location: {
      city: 'Imerovigli',
      region: 'Santorini',
      country: 'Greece',
      coordinates: { lat: 36.4327, lng: 25.4234 }
    }
  },
  {
    id: 'villa-thira-4',
    externalId: 'tok_456789',
    name: 'Villa Thira Heritage',
    description: 'A beautifully restored captain\'s house in Pyrgos village, combining authentic heritage with modern luxury and vineyard views.',
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    images: [
      '/placeholder.svg',
    ],
    amenities: ['Garden', 'Mountain View', 'Air Conditioning', 'WiFi', 'Kitchen', 'Courtyard', 'Wine Tasting'],
    location: {
      city: 'Pyrgos',
      region: 'Santorini',
      country: 'Greece',
      coordinates: { lat: 36.3817, lng: 25.4556 }
    }
  }
];

// Mock fees/taxes
const MOCK_FEES: PMSFee[] = [
  { id: 'fee_cleaning', name: 'Cleaning Fee', type: 'fixed', amount: 150, isTax: false, isMandatory: true },
  { id: 'tax_vat', name: 'VAT (24%)', type: 'percentage', amount: 24, isTax: true, isMandatory: true },
  { id: 'tax_municipal', name: 'Municipal Tax', type: 'per_night', amount: 4, isTax: true, isMandatory: true },
];

// Generate mock availability and rates
function generateMockAvailability(propertyId: string, startDate: string, endDate: string): PMSAvailability[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = eachDayOfInterval({ start, end });
  
  // Simulate some booked dates (random pattern)
  const bookedRanges = [
    { start: addDays(new Date(), 3), end: addDays(new Date(), 7) },
    { start: addDays(new Date(), 15), end: addDays(new Date(), 20) },
  ];
  
  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isBooked = bookedRanges.some(range => 
      day >= range.start && day <= range.end
    );
    
    return {
      propertyId,
      date: dateStr,
      available: !isBooked,
      minStay: isWeekend(day) ? 3 : 2,
      checkInAllowed: !isBooked,
      checkOutAllowed: true
    };
  });
}

function generateMockRates(propertyId: string, startDate: string, endDate: string): PMSRate[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = eachDayOfInterval({ start, end });
  
  // Base rates by property
  const baseRates: Record<string, number> = {
    'villa-caldera-1': 850,
    'villa-aegean-2': 650,
    'villa-santorini-3': 1200,
    'villa-thira-4': 450,
  };
  
  const baseRate = baseRates[propertyId] || 500;
  
  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const month = day.getMonth();
    
    // Seasonal multipliers
    let multiplier = 1;
    if (month >= 5 && month <= 8) multiplier = 1.5; // Summer peak
    if (month >= 3 && month <= 4) multiplier = 1.2; // Spring
    if (month >= 9 && month <= 10) multiplier = 1.3; // Fall
    
    // Weekend premium
    if (isWeekend(day)) multiplier *= 1.1;
    
    return {
      propertyId,
      date: dateStr,
      baseRate: Math.round(baseRate * multiplier),
      currency: 'EUR',
      minStay: isWeekend(day) ? 3 : 2
    };
  });
}

// In-memory booking store for mock
const mockBookings: Map<string, PMSBookingRequest & { externalBookingId: string; status: string }> = new Map();

export class MockPMSAdapter implements PMSAdapter {
  private simulateDelay = true;
  private delayMs = 300;

  private async delay(): Promise<void> {
    if (this.simulateDelay) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
  }

  async testConnection(): Promise<boolean> {
    await this.delay();
    return true;
  }

  async fetchProperties(): Promise<PMSProperty[]> {
    await this.delay();
    return MOCK_PROPERTIES;
  }

  async fetchProperty(externalId: string): Promise<PMSProperty | null> {
    await this.delay();
    const property = MOCK_PROPERTIES.find(p => p.externalId === externalId);
    return property || null;
  }

  async fetchAvailability(
    externalPropertyId: string, 
    startDate: string, 
    endDate: string
  ): Promise<PMSAvailability[]> {
    await this.delay();
    const property = MOCK_PROPERTIES.find(p => p.externalId === externalPropertyId);
    if (!property) return [];
    
    const availability = generateMockAvailability(property.id, startDate, endDate);
    return availability;
  }

  async fetchRates(
    externalPropertyId: string, 
    startDate: string, 
    endDate: string
  ): Promise<PMSRate[]> {
    await this.delay();
    const property = MOCK_PROPERTIES.find(p => p.externalId === externalPropertyId);
    if (!property) return [];
    
    const rates = generateMockRates(property.id, startDate, endDate);
    return rates;
  }

  async fetchFees(_externalPropertyId: string): Promise<PMSFee[]> {
    await this.delay();
    return MOCK_FEES;
  }

  async createBooking(request: PMSBookingRequest): Promise<PMSBookingResponse> {
    await this.delay();
    
    // Simulate validation
    if (!request.guestInfo.email) {
      return { success: false, error: 'Guest email is required' };
    }
    
    // Generate booking ID
    const externalBookingId = `BK${Date.now()}`;
    const confirmationCode = `ARV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Store mock booking
    mockBookings.set(externalBookingId, {
      ...request,
      externalBookingId,
      status: 'confirmed'
    });
    
    return {
      success: true,
      externalBookingId,
      confirmationCode
    };
  }

  async cancelBooking(request: PMSCancellationRequest): Promise<PMSCancellationResponse> {
    await this.delay();
    
    const booking = mockBookings.get(request.externalBookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }
    
    booking.status = 'cancelled';
    
    return {
      success: true,
      refundAmount: booking.totalAmount * 0.5 // 50% refund simulation
    };
  }

  async syncAll(): Promise<PMSSyncResult> {
    await this.delay();
    return {
      success: true,
      recordsProcessed: MOCK_PROPERTIES.length * 90, // ~90 days of data
      recordsFailed: 0
    };
  }

  async syncAvailability(_externalPropertyId: string): Promise<PMSSyncResult> {
    await this.delay();
    return {
      success: true,
      recordsProcessed: 90,
      recordsFailed: 0
    };
  }

  async syncRates(_externalPropertyId: string): Promise<PMSSyncResult> {
    await this.delay();
    return {
      success: true,
      recordsProcessed: 90,
      recordsFailed: 0
    };
  }
}

// Export singleton instance
export const mockPMSAdapter = new MockPMSAdapter();
