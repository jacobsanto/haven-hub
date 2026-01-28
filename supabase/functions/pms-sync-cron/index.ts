// Scheduled PMS Sync Edge Function
// Called by pg_cron every 5 minutes (configurable) to sync availability from PMS

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PMSPropertyMapping {
  property_id: string;
  external_property_id: string;
  pms_connection_id: string;
}

interface PMSConnection {
  id: string;
  pms_name: string;
  config: {
    provider?: string;
    auto_sync_enabled?: boolean;
    sync_interval_minutes?: number;
  } | null;
}

async function callTokeetAPI(
  endpoint: string,
  apiKey: string,
  accountId: string
): Promise<Response> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `https://capi.tokeet.com/v1${endpoint}${separator}account=${accountId}`;

  return await fetch(url, {
    method: "GET",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
  });
}

async function syncPropertyAvailability(
  supabaseUrl: string,
  serviceRoleKey: string,
  propertyId: string,
  externalPropertyId: string,
  apiKey: string,
  accountId: string
): Promise<{ success: boolean; blockedDays: number; error?: string }> {
  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Calculate date range - 12 months
    const start = new Date().toISOString().split("T")[0];
    const endDateObj = new Date();
    endDateObj.setMonth(endDateObj.getMonth() + 12);
    const end = endDateObj.toISOString().split("T")[0];

    // Fetch availability from Tokeet
    const endpoint = `/rental/${externalPropertyId}/availability?from=${start}&to=${end}`;
    const response = await callTokeetAPI(endpoint, apiKey, accountId);
    
    if (!response.ok) {
      throw new Error(`Tokeet API error: ${response.statusText}`);
    }

    const tokeetAvailability = await response.json();

    // Process blocked date ranges
    interface BlockedRange {
      from?: string;
      to?: string;
      start?: string;
      end?: string;
    }
    
    let blockedRanges: Array<{ from: string; to: string }> = [];

    if (Array.isArray(tokeetAvailability)) {
      blockedRanges = tokeetAvailability
        .map((range: BlockedRange) => ({
          from: range.from || range.start || "",
          to: range.to || range.end || "",
        }))
        .filter((r: { from: string; to: string }) => r.from && r.to);
    } else if (tokeetAvailability?.blocked && Array.isArray(tokeetAvailability.blocked)) {
      blockedRanges = tokeetAvailability.blocked;
    } else if (tokeetAvailability?.data && Array.isArray(tokeetAvailability.data)) {
      blockedRanges = tokeetAvailability.data
        .map((range: BlockedRange) => ({
          from: range.from || range.start || "",
          to: range.to || range.end || "",
        }))
        .filter((r: { from: string; to: string }) => r.from && r.to);
    }

    // Build set of blocked dates
    const blockedDates = new Set<string>();
    for (const range of blockedRanges) {
      const rangeStart = new Date(range.from);
      const rangeEnd = new Date(range.to);
      for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
        blockedDates.add(d.toISOString().split("T")[0]);
      }
    }

    // Prepare blocked date records
    const availabilityRecords: Array<{ property_id: string; date: string; available: boolean }> = [];
    for (const dateStr of blockedDates) {
      availabilityRecords.push({
        property_id: propertyId,
        date: dateStr,
        available: false,
      });
    }

    // Clear existing availability records for this property and date range
    await adminClient
      .from("availability")
      .delete()
      .eq("property_id", propertyId)
      .gte("date", start)
      .lte("date", end);

    // Insert blocked dates
    if (availabilityRecords.length > 0) {
      const { error: upsertError } = await adminClient
        .from("availability")
        .insert(availabilityRecords);

      if (upsertError) {
        throw new Error(`Failed to upsert availability: ${upsertError.message}`);
      }
    }

    // Update last sync timestamp
    await adminClient
      .from("pms_property_map")
      .update({ last_availability_sync_at: new Date().toISOString() })
      .eq("property_id", propertyId);

    return { success: true, blockedDays: blockedDates.size };
  } catch (error) {
    return {
      success: false,
      blockedDays: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client (service role for cron jobs)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get Tokeet credentials
    const apiKey = Deno.env.get("TOKEET_API_KEY");
    const accountId = Deno.env.get("TOKEET_ACCOUNT_ID");

    if (!apiKey || !accountId) {
      console.error("Tokeet credentials not configured");
      return new Response(
        JSON.stringify({ error: "Tokeet credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let action = "sync-all-availability";
    let triggerType: "scheduled" | "manual" = "scheduled";
    
    try {
      const body = await req.json();
      action = body.action || action;
      triggerType = body.triggerType || triggerType;
    } catch {
      // Empty body is fine for scheduled calls
    }

    if (action === "sync-all-availability") {
      // Get active connection with auto-sync enabled
      const { data: connection, error: connError } = await adminClient
        .from("pms_connections")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (connError || !connection) {
        console.log("No active PMS connection found");
        return new Response(
          JSON.stringify({ success: false, message: "No active PMS connection" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const config = connection.config as PMSConnection["config"];
      
      // Check if auto-sync is enabled (skip for manual triggers)
      if (triggerType === "scheduled" && config?.auto_sync_enabled === false) {
        console.log("Auto-sync is disabled");
        return new Response(
          JSON.stringify({ success: true, message: "Auto-sync disabled", skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get all property mappings with sync enabled
      const { data: mappings, error: mappingsError } = await adminClient
        .from("pms_property_map")
        .select("property_id, external_property_id, pms_connection_id")
        .eq("pms_connection_id", connection.id)
        .eq("sync_enabled", true);

      if (mappingsError) {
        throw new Error(`Failed to fetch mappings: ${mappingsError.message}`);
      }

      if (!mappings || mappings.length === 0) {
        console.log("No property mappings found");
        return new Response(
          JSON.stringify({ success: true, message: "No properties to sync", total: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create sync run record
      const { data: syncRun, error: syncRunError } = await adminClient
        .from("pms_sync_runs")
        .insert({
          pms_connection_id: connection.id,
          sync_type: "availability",
          status: "running",
          trigger_type: triggerType,
        })
        .select()
        .single();

      if (syncRunError) {
        console.error("Failed to create sync run:", syncRunError);
      }

      // Sync each property
      let synced = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const mapping of mappings as PMSPropertyMapping[]) {
        const result = await syncPropertyAvailability(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          mapping.property_id,
          mapping.external_property_id,
          apiKey,
          accountId
        );

        if (result.success) {
          synced++;
        } else {
          failed++;
          if (result.error) {
            errors.push(`${mapping.external_property_id}: ${result.error}`);
          }
        }
      }

      // Update sync run
      if (syncRun) {
        await adminClient
          .from("pms_sync_runs")
          .update({
            status: failed === 0 ? "success" : synced > 0 ? "partial" : "failed",
            completed_at: new Date().toISOString(),
            records_processed: synced,
            records_failed: failed,
            error_summary: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
          })
          .eq("id", syncRun.id);
      }

      // Update connection last sync
      await adminClient
        .from("pms_connections")
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: failed === 0 ? "success" : synced > 0 ? "partial" : "error",
        })
        .eq("id", connection.id);

      console.log(`Sync complete: ${synced} synced, ${failed} failed`);

      return new Response(
        JSON.stringify({
          success: failed === 0,
          total: mappings.length,
          synced,
          failed,
          errors: errors.slice(0, 5),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync cron error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
