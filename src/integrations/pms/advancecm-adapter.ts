// AdvanceCM (Tokeet) PMS Adapter
// Real implementation that calls the advancecm-sync edge function

import { supabase } from "@/integrations/supabase/client";
import type {
  PMSAdapter,
  PMSProperty,
  PMSAvailability,
  PMSRate,
  PMSFee,
  PMSBookingRequest,
  PMSBookingResponse,
  PMSCancellationRequest,
  PMSCancellationResponse,
  PMSSyncResult,
} from "./types";

export interface TokeetProperty {
  externalId: string;
  name: string;
  description?: string | null;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  city: string;
  region?: string | null;
  country: string;
  propertyType: string;
  highlights: string[];
  images: string[];
  coordinates?: { lat: number; lng: number } | null;
}

async function callEdgeFunction<T>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advancecm-sync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    }
  );

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || "Edge function call failed");
  }

  return data as T;
}

export class AdvanceCMAdapter implements PMSAdapter {
  async testConnection(): Promise<boolean> {
    try {
      const result = await callEdgeFunction<{ success: boolean }>("test");
      return result.success;
    } catch (error) {
      console.error("AdvanceCM connection test failed:", error);
      return false;
    }
  }

  async fetchProperties(): Promise<PMSProperty[]> {
    const result = await callEdgeFunction<{
      success: boolean;
      properties: TokeetProperty[];
    }>("fetch-properties");

    return result.properties.map((p) => ({
      id: p.externalId,
      externalId: p.externalId,
      name: p.name,
      description: p.description || undefined,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      maxGuests: p.maxGuests,
      images: p.images,
      amenities: p.highlights,
      location: {
        city: p.city,
        region: p.region || undefined,
        country: p.country,
        coordinates: p.coordinates || undefined,
      },
    }));
  }

  async fetchProperty(externalId: string): Promise<PMSProperty | null> {
    try {
      const result = await callEdgeFunction<{
        success: boolean;
        property: TokeetProperty;
      }>("fetch-property", { externalId });

      const p = result.property;
      return {
        id: p.externalId,
        externalId: p.externalId,
        name: p.name,
        description: p.description || undefined,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        maxGuests: p.maxGuests,
        images: p.images,
        amenities: p.highlights,
        location: {
          city: p.city,
          region: p.region || undefined,
          country: p.country,
          coordinates: p.coordinates || undefined,
        },
      };
    } catch {
      return null;
    }
  }

  async fetchAvailability(
    externalPropertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PMSAvailability[]> {
    const result = await callEdgeFunction<{
      success: boolean;
      availability: Array<{
        date: string;
        available: boolean;
        minStay?: number;
      }>;
    }>("fetch-availability", { externalId: externalPropertyId, startDate, endDate });

    return result.availability.map((a) => ({
      propertyId: externalPropertyId,
      date: a.date,
      available: a.available,
      minStay: a.minStay,
    }));
  }

  async fetchRates(
    externalPropertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PMSRate[]> {
    try {
      const result = await callEdgeFunction<{
        success: boolean;
        rates: Array<{
          externalId: string;
          nightly: number;
          minStay: number;
          validFrom?: string;
          validTo?: string;
          currency: string;
        }>;
      }>("fetch-rates", { externalId: externalPropertyId });

      return result.rates
        .filter((r) => {
          if (!r.validFrom || !r.validTo) return true;
          return r.validFrom <= endDate && r.validTo >= startDate;
        })
        .map((r) => ({
          propertyId: externalPropertyId,
          date: r.validFrom || startDate,
          baseRate: r.nightly,
          currency: r.currency,
          minStay: r.minStay,
        }));
    } catch (error) {
      console.error("Failed to fetch rates:", error);
      return [];
    }
  }

  async fetchFees(_externalPropertyId: string): Promise<PMSFee[]> {
    // TODO: Implement when Tokeet fees endpoint is available
    return [];
  }

  async createBooking(_request: PMSBookingRequest): Promise<PMSBookingResponse> {
    // TODO: Implement when ready for booking push
    return {
      success: false,
      error: "Booking push not yet implemented",
    };
  }

  async cancelBooking(
    _request: PMSCancellationRequest
  ): Promise<PMSCancellationResponse> {
    // TODO: Implement when ready for cancellation push
    return {
      success: false,
      error: "Cancellation push not yet implemented",
    };
  }

  async syncAll(): Promise<PMSSyncResult> {
    try {
      const properties = await this.fetchProperties();
      return {
        success: true,
        recordsProcessed: properties.length,
        recordsFailed: 0,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 1,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async syncAvailability(externalPropertyId: string): Promise<PMSSyncResult> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 12);
      const endDate = futureDate.toISOString().split("T")[0];

      const availability = await this.fetchAvailability(
        externalPropertyId,
        today,
        endDate
      );
      return {
        success: true,
        recordsProcessed: availability.length,
        recordsFailed: 0,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 1,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async syncRates(_externalPropertyId: string): Promise<PMSSyncResult> {
    // TODO: Implement when Tokeet rates endpoint is available
    return {
      success: true,
      recordsProcessed: 0,
      recordsFailed: 0,
    };
  }
}

// Helper function to import a property from Tokeet
export async function importPropertyFromTokeet(
  propertyData: TokeetProperty & { pkey: string },
  connectionId: string
): Promise<{ success: boolean; property?: { id: string; name: string }; error?: string }> {
  try {
    const result = await callEdgeFunction<{
      success: boolean;
      property: { id: string; name: string };
      message: string;
    }>("import-property", {
      propertyData: {
        pkey: propertyData.externalId,
        name: propertyData.name,
        description: propertyData.description,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        sleep_max: propertyData.maxGuests,
        type: propertyData.propertyType,
        address: {
          city: propertyData.city,
          state: propertyData.region,
          CC: propertyData.country,
        },
        tags: propertyData.highlights,
        images: propertyData.images.map((url) => ({ url })),
      },
      connectionId,
    });

    return {
      success: result.success,
      property: result.property,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}
