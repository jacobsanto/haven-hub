// Scheduled PMS Sync Edge Function
// Called by pg_cron every 5 minutes (configurable) to sync availability AND bookings from PMS

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

interface TokeetInquiry {
  pkey: string;
  rental_id?: string;
  arrive: number;
  depart: number;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  num_guests?: number;
  num_adults?: number;
  num_child?: number;
  booked_price?: number;
  source?: string;
  status?: string;
}

interface BookingSyncResult {
  created: number;
  updated: number;
  errors: string[];
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

function mapSourceToBookingSource(tokeetSource: string | undefined): string {
  if (!tokeetSource) return "direct";
  const sourceLower = tokeetSource.toLowerCase();
  if (sourceLower.includes("airbnb")) return "airbnb";
  if (sourceLower.includes("booking.com") || sourceLower.includes("bookingcom")) return "booking_com";
  if (sourceLower.includes("expedia")) return "expedia";
  if (sourceLower.includes("vrbo") || sourceLower.includes("homeaway")) return "vrbo";
  return "direct";
}

function generateBookingReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${year}${month}-${random}`;
}

async function syncPropertyBookings(
  supabaseUrl: string,
  serviceRoleKey: string,
  propertyId: string,
  externalPropertyId: string,
  apiKey: string,
  accountId: string
): Promise<BookingSyncResult> {
  const result: BookingSyncResult = { created: 0, updated: 0, errors: [] };

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Calculate date range - 6 months forward
    const now = new Date();
    const startTimestamp = Math.floor(now.getTime() / 1000);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Fetch inquiries from Tokeet for this property
    const endpoint = `/inquiry?rental_id=${externalPropertyId}&arrive_from=${startTimestamp}&arrive_to=${endTimestamp}&limit=100`;
    const response = await callTokeetAPI(endpoint, apiKey, accountId);

    if (!response.ok) {
      throw new Error(`Tokeet inquiry API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Handle various response formats
    const inquiries: TokeetInquiry[] = Array.isArray(responseData)
      ? responseData
      : (responseData.items || responseData.data || responseData.inquiries || []);

    // Filter to only booked/confirmed inquiries
    const activeBookings = inquiries.filter((inq: TokeetInquiry) => {
      const status = (inq.status || "").toLowerCase();
      return status === "booked" || status === "confirmed" || status === "instant";
    });

    if (activeBookings.length === 0) {
      return result;
    }

    // Get existing bookings by external_booking_id
    const externalIds = activeBookings.map((inq) => inq.pkey);
    const { data: existingBookings } = await adminClient
      .from("bookings")
      .select("id, external_booking_id, check_in, check_out")
      .in("external_booking_id", externalIds);

    const existingMap = new Map(
      (existingBookings || []).map((b) => [b.external_booking_id, b])
    );

    // Process each booking
    for (const inquiry of activeBookings) {
      try {
        const checkInDate = new Date(inquiry.arrive * 1000);
        const checkOutDate = new Date(inquiry.depart * 1000);
        const checkIn = checkInDate.toISOString().split("T")[0];
        const checkOut = checkOutDate.toISOString().split("T")[0];
        const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

        const existing = existingMap.get(inquiry.pkey);

        if (existing) {
          // Update if dates changed
          if (existing.check_in !== checkIn || existing.check_out !== checkOut) {
            const { error } = await adminClient
              .from("bookings")
              .update({
                check_in: checkIn,
                check_out: checkOut,
                nights,
                pms_synced_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            if (error) {
              result.errors.push(`Update ${inquiry.pkey}: ${error.message}`);
            } else {
              result.updated++;
            }
          }
        } else {
          // Create new booking
          const bookingData = {
            property_id: propertyId,
            external_booking_id: inquiry.pkey,
            booking_reference: generateBookingReference(),
            guest_name: inquiry.guest_name || "Guest",
            guest_email: inquiry.guest_email || "unknown@external.booking",
            guest_phone: inquiry.guest_phone || null,
            check_in: checkIn,
            check_out: checkOut,
            nights,
            guests: inquiry.num_guests || 1,
            adults: inquiry.num_adults || inquiry.num_guests || 1,
            children: inquiry.num_child || 0,
            total_price: inquiry.booked_price || 0,
            source: mapSourceToBookingSource(inquiry.source),
            status: "confirmed",
            payment_status: "paid",
            pms_sync_status: "synced",
            pms_synced_at: new Date().toISOString(),
          };

          const { error } = await adminClient
            .from("bookings")
            .insert(bookingData);

          if (error) {
            // Check for duplicate constraint violation
            if (error.code === "23505") {
              // Already exists, skip
            } else {
              result.errors.push(`Create ${inquiry.pkey}: ${error.message}`);
            }
          } else {
            result.created++;
          }
        }
      } catch (bookingError) {
        result.errors.push(
          `Process ${inquiry.pkey}: ${bookingError instanceof Error ? bookingError.message : "Unknown error"}`
        );
      }
    }

    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    return result;
  }
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

    // Prepare blocked date records for UPSERT
    const availabilityRecords: Array<{ property_id: string; date: string; available: boolean }> = [];
    for (const dateStr of blockedDates) {
      availabilityRecords.push({
        property_id: propertyId,
        date: dateStr,
        available: false,
      });
    }

    // Use UPSERT with ON CONFLICT to atomically update availability
    if (availabilityRecords.length > 0) {
      const { error: upsertError } = await adminClient
        .from("availability")
        .upsert(availabilityRecords, {
          onConflict: "property_id,date",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        throw new Error(`Failed to upsert availability: ${upsertError.message}`);
      }
    }

    // Clear old blocks for dates that are now available
    const { data: existingBlocked, error: fetchError } = await adminClient
      .from("availability")
      .select("date")
      .eq("property_id", propertyId)
      .eq("available", false)
      .gte("date", start)
      .lte("date", end);

    if (fetchError) {
      console.warn(`Could not fetch existing blocked dates: ${fetchError.message}`);
    } else if (existingBlocked) {
      const datesToUnblock = existingBlocked
        .map((r) => r.date)
        .filter((d) => !blockedDates.has(d));

      if (datesToUnblock.length > 0) {
        const { error: deleteError } = await adminClient
          .from("availability")
          .delete()
          .eq("property_id", propertyId)
          .in("date", datesToUnblock);

        if (deleteError) {
          console.warn(`Could not unblock dates: ${deleteError.message}`);
        }
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
          sync_type: "availability_bookings",
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
      let bookingsCreated = 0;
      let bookingsUpdated = 0;
      const errors: string[] = [];

      for (const mapping of mappings as PMSPropertyMapping[]) {
        // Step 1: Sync availability
        const availResult = await syncPropertyAvailability(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          mapping.property_id,
          mapping.external_property_id,
          apiKey,
          accountId
        );

        if (availResult.success) {
          synced++;
        } else {
          failed++;
          if (availResult.error) {
            errors.push(`Avail ${mapping.external_property_id}: ${availResult.error}`);
          }
        }

        // Step 2: Sync bookings (even if availability fails, try bookings)
        const bookingResult = await syncPropertyBookings(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          mapping.property_id,
          mapping.external_property_id,
          apiKey,
          accountId
        );

        bookingsCreated += bookingResult.created;
        bookingsUpdated += bookingResult.updated;
        
        if (bookingResult.errors.length > 0) {
          errors.push(...bookingResult.errors.slice(0, 3));
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
            error_summary: errors.length > 0 
              ? `${errors.slice(0, 5).join("; ")}${bookingsCreated > 0 ? ` | Bookings: +${bookingsCreated}` : ""}`
              : bookingsCreated > 0 ? `Bookings created: ${bookingsCreated}, updated: ${bookingsUpdated}` : null,
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

      console.log(`Sync complete: ${synced} properties synced, ${failed} failed, ${bookingsCreated} bookings created, ${bookingsUpdated} updated`);

      return new Response(
        JSON.stringify({
          success: failed === 0,
          total: mappings.length,
          synced,
          failed,
          bookingsCreated,
          bookingsUpdated,
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
