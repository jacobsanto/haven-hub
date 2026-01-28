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

// Sync rates for a specific property
export function useSyncPropertyRates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      externalId,
      propertyId,
    }: {
      externalId: string;
      propertyId: string;
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
            action: "sync-rates",
            externalId,
            propertyId,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to sync rates");
      }

      return data as {
        success: boolean;
        basePrice: number;
        seasonalRatesCreated: number;
        ratePlansCreated: number;
        message: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["seasonal-rates"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "rate-plans"] });
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
