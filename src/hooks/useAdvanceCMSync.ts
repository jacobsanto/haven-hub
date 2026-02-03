import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AdvanceCMAdapter,
  TokeetProperty,
  importPropertyFromTokeet,
} from "@/integrations/pms/advancecm-adapter";

const adapter = new AdvanceCMAdapter();

// Test the AdvanceCM connection
export function useTestAdvanceCMConnection() {
  return useMutation({
    mutationFn: async () => {
      const success = await adapter.testConnection();
      return { success };
    },
  });
}

// Fetch properties from Tokeet
export function useFetchTokeetProperties() {
  return useMutation({
    mutationFn: async () => {
      const properties = await adapter.fetchProperties();
      return properties;
    },
  });
}

// Get already mapped property external IDs
export function useMappedPropertyIds(connectionId?: string) {
  return useQuery({
    queryKey: ["pms-mapped-ids", connectionId],
    queryFn: async () => {
      if (!connectionId) return [];

      const { data, error } = await supabase
        .from("pms_property_map")
        .select("external_property_id")
        .eq("pms_connection_id", connectionId);

      if (error) throw error;
      return data.map((m) => m.external_property_id);
    },
    enabled: !!connectionId,
  });
}

// Import a property from Tokeet
export function useImportTokeetProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      property,
      connectionId,
    }: {
      property: TokeetProperty;
      connectionId: string;
    }) => {
      return await importPropertyFromTokeet(
        { ...property, pkey: property.externalId },
        connectionId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pms-mapped-ids"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "pms"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

// Batch import multiple properties
export function useBatchImportProperties() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      properties,
      connectionId,
    }: {
      properties: TokeetProperty[];
      connectionId: string;
    }) => {
      const results: Array<{
        externalId: string;
        success: boolean;
        error?: string;
      }> = [];

      for (const property of properties) {
        try {
          const result = await importPropertyFromTokeet(
            { ...property, pkey: property.externalId },
            connectionId
          );
          results.push({
            externalId: property.externalId,
            success: result.success,
            error: result.error,
          });
        } catch (error) {
          results.push({
            externalId: property.externalId,
            success: false,
            error: error instanceof Error ? error.message : "Import failed",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      return {
        results,
        successCount,
        failedCount,
        totalCount: properties.length,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pms-mapped-ids"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "pms"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

// Push booking to PMS
export function usePushBookingToPMS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      propertyId,
      bookingReference,
      checkIn,
      checkOut,
      guests,
      adults,
      children,
      guestInfo,
      totalPrice,
      currency,
      priceBreakdown,
      specialRequests,
    }: {
      bookingId: string;
      propertyId: string;
      bookingReference: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      adults: number;
      children: number;
      guestInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        country?: string;
      };
      totalPrice: number;
      currency: string;
      priceBreakdown: Array<{ label: string; amount: number }>;
      specialRequests?: string;
    }) => {
      // Get external property ID from mapping
      const { data: mapping } = await supabase
        .from("pms_property_map")
        .select("external_property_id")
        .eq("property_id", propertyId)
        .maybeSingle();

      if (!mapping) {
        // Property not linked to PMS - skip push
        return { success: true, skipped: true };
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      // Format price breakdown for notes
      const notesLines = [
        `Booking Ref: ${bookingReference}`,
        `Adults: ${adults}, Children: ${children}`,
        "",
        "=== Price Breakdown ===",
        ...priceBreakdown.map((item) => `${item.label}: €${item.amount.toFixed(2)}`),
        "",
        specialRequests ? `Special Requests: ${specialRequests}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advancecm-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "create-booking",
            externalPropertyId: mapping.external_property_id,
            bookingReference,
            checkIn,
            checkOut,
            guests,
            adults,
            children,
            guestInfo,
            totalPrice,
            currency,
            priceBreakdownNotes: notesLines,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local booking with external ID
        await supabase
          .from("bookings")
          .update({
            external_booking_id: result.externalBookingId,
            pms_sync_status: "synced",
            pms_synced_at: new Date().toISOString(),
          })
          .eq("id", bookingId);
      }

      return result;
    },
    onError: async (_error, variables) => {
      // Mark as failed for retry
      await supabase
        .from("bookings")
        .update({ pms_sync_status: "failed" })
        .eq("id", variables.bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// Cancel booking in PMS
export function useCancelBookingInPMS() {
  return useMutation({
    mutationFn: async ({
      externalBookingId,
      cancellationReason,
    }: {
      externalBookingId: string;
      cancellationReason?: string;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advancecm-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "cancel-booking",
            externalBookingId,
            cancellationReason,
          }),
        }
      );

      return await response.json();
    },
  });
}

// Create or ensure PMS connection exists for AdvanceCM
export function useEnsureAdvanceCMConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Check if AdvanceCM connection exists
      const { data: existing, error: fetchError } = await supabase
        .from("pms_connections")
        .select("*")
        .eq("pms_name", "AdvanceCM")
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update to active if not already
        if (!existing.is_active) {
          await supabase
            .from("pms_connections")
            .update({ is_active: true })
            .eq("id", existing.id);
        }
        return existing;
      }

      // Create new connection
      const { data: newConnection, error: createError } = await supabase
        .from("pms_connections")
        .insert({
          pms_name: "AdvanceCM",
          is_active: true,
          config: { provider: "tokeet" },
        })
        .select()
        .single();

      if (createError) throw createError;
      return newConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pms", "connection"] });
      queryClient.invalidateQueries({ queryKey: ["pms-connection"] });
    },
  });
}

// Sync availability for a single property from PMS
export function useSyncPropertyAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      startDate,
      endDate,
    }: {
      propertyId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advancecm-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "sync-availability",
            propertyId,
            startDate,
            endDate,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to sync availability");
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries after sync
      queryClient.invalidateQueries({ queryKey: ['availability', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'availability-sync-health'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms'] });
    },
  });
}
