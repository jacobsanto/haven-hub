// Scheduled PMS Sync Edge Function
// Called by pg_cron every 5 minutes (configurable) to sync availability AND bookings from PMS
// Syncs a rolling 12-month window for all properties

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

interface TokeetAvailabilityRange {
  from?: string;
  to?: string;
  start?: string;
  end?: string;
  title?: string;
  available?: number;
  status?: string;
  pkey?: string;
  id?: string;
  closed?: number;
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

function mapSourceToBookingSource(title: string | undefined): string {
  if (!title) return "direct";
  const titleLower = title.toLowerCase();
  if (titleLower.includes("airbnb")) return "airbnb";
  if (titleLower.includes("booking.com") || titleLower.includes("bookingcom")) return "booking_com";
  if (titleLower.includes("expedia")) return "expedia";
  if (titleLower.includes("vrbo") || titleLower.includes("homeaway")) return "vrbo";
  return "direct";
}

function generateBookingReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${year}${month}-${random}`;
}

function generateExternalId(from: string, to: string, title: string): string {
  // Create a deterministic ID from the booking details
  const base = `${from}-${to}-${title}`.replace(/[^a-zA-Z0-9-]/g, '_');
  return `tokeet-${base}`.substring(0, 100);
}

function isValidBookingTitle(title: string | undefined): boolean {
  if (!title || title.trim() === "") return false;
  
  // Skip maintenance/blocked entries
  const skipPatterns = [
    /maintenance/i,
    /blocked/i,
    /closed/i,
    /owner/i,
    /unavailable/i,
    /hold$/i,  // Ends with "hold" but not "Airbnb hold" which is a real booking
  ];
  
  // Allow "Airbnb hold" as it represents a real Airbnb booking
  if (/airbnb\s*hold/i.test(title)) return true;
  
  for (const pattern of skipPatterns) {
    if (pattern.test(title)) return false;
  }
  
  return true;
}

// Extract bookings from availability response (main booking data source)
async function extractBookingsFromAvailability(
  supabaseUrl: string,
  serviceRoleKey: string,
  propertyId: string,
  availabilityRanges: TokeetAvailabilityRange[]
): Promise<BookingSyncResult> {
  const result: BookingSyncResult = { created: 0, updated: 0, errors: [] };

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Filter to only ranges that are bookings (available: 1 with a guest name)
    const bookingRanges = availabilityRanges.filter((range) => {
      return range.available === 1 && isValidBookingTitle(range.title);
    });

    if (bookingRanges.length === 0) {
      return result;
    }

    console.log(`Property ${propertyId}: Found ${bookingRanges.length} potential bookings from availability data`);

    // Get existing bookings for this property by external_booking_id
    const externalIds = bookingRanges.map((range) => 
      generateExternalId(
        range.from || range.start || "",
        range.to || range.end || "",
        range.title || ""
      )
    );

    const { data: existingBookings } = await adminClient
      .from("bookings")
      .select("id, external_booking_id, check_in, check_out")
      .eq("property_id", propertyId)
      .in("external_booking_id", externalIds);

    const existingMap = new Map(
      (existingBookings || []).map((b) => [b.external_booking_id, b])
    );

    // Process each booking range
    for (const range of bookingRanges) {
      try {
        const fromDate = range.from || range.start || "";
        const toDate = range.to || range.end || "";
        
        if (!fromDate || !toDate) continue;

        const checkInDate = new Date(fromDate);
        const checkOutDate = new Date(toDate);
        
        // Skip past bookings
        if (checkOutDate < new Date()) continue;

        const checkIn = checkInDate.toISOString().split("T")[0];
        const checkOut = checkOutDate.toISOString().split("T")[0];
        const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

        const externalId = generateExternalId(fromDate, toDate, range.title || "");
        const existing = existingMap.get(externalId);

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
              result.errors.push(`Update ${externalId}: ${error.message}`);
            } else {
              result.updated++;
            }
          }
        } else {
          // Create new booking
          const guestName = range.title || "Guest";
          const source = mapSourceToBookingSource(range.title);
          
          const bookingData = {
            property_id: propertyId,
            external_booking_id: externalId,
            booking_reference: generateBookingReference(),
            guest_name: guestName,
            guest_email: "external@booking.sync",
            guest_phone: null,
            check_in: checkIn,
            check_out: checkOut,
            nights,
            guests: 2, // Default
            adults: 2,
            children: 0,
            total_price: 0, // Unknown from availability API
            source,
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
              // Already exists, skip silently
            } else {
              result.errors.push(`Create ${externalId}: ${error.message}`);
            }
          } else {
            result.created++;
          }
        }
      } catch (rangeError) {
        result.errors.push(
          `Process range: ${rangeError instanceof Error ? rangeError.message : "Unknown error"}`
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
): Promise<{ success: boolean; blockedDays: number; bookingResult: BookingSyncResult; error?: string }> {
  const bookingResult: BookingSyncResult = { created: 0, updated: 0, errors: [] };
  
  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Calculate date range - 12 months rolling window
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
    
    console.log(`Property ${propertyId}: Tokeet API response type: ${typeof tokeetAvailability}, isArray: ${Array.isArray(tokeetAvailability)}, sample: ${JSON.stringify(tokeetAvailability).substring(0, 500)}`);

    // Process availability response - could be array or object with data
    let availabilityRanges: TokeetAvailabilityRange[] = [];
    
    if (Array.isArray(tokeetAvailability)) {
      availabilityRanges = tokeetAvailability;
    } else if (tokeetAvailability?.data && Array.isArray(tokeetAvailability.data)) {
      availabilityRanges = tokeetAvailability.data;
    } else if (tokeetAvailability?.blocked && Array.isArray(tokeetAvailability.blocked)) {
      availabilityRanges = tokeetAvailability.blocked;
    }

    // STEP 1: Extract and sync bookings from the availability data
    const extractedBookings = await extractBookingsFromAvailability(
      supabaseUrl,
      serviceRoleKey,
      propertyId,
      availabilityRanges
    );
    
    bookingResult.created = extractedBookings.created;
    bookingResult.updated = extractedBookings.updated;
    bookingResult.errors = extractedBookings.errors;

    // STEP 2: Process blocked date ranges for availability table
    // Tokeet availability API returns ranges with 'available' field:
    // - available: 1 means BOOKED (counterintuitive naming in Tokeet)
    // - available: 0 means AVAILABLE
    // We need to block only ranges where available === 1
    
    const blockedRanges = availabilityRanges
      .filter((range: TokeetAvailabilityRange) => {
        // Only include if explicitly marked as unavailable/booked
        // Tokeet uses available: 1 to mean "this range is a booking" (counterintuitive)
        return range.available === 1 || range.status === 'booked' || range.status === 'blocked';
      })
      .map((range: TokeetAvailabilityRange) => ({
        from: range.from || range.start || "",
        to: range.to || range.end || "",
      }))
      .filter((r: { from: string; to: string }) => r.from && r.to);

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
      // Normalize date formats before comparison (handle both ISO and date-only formats)
      const normalizeDate = (d: string) => d.split('T')[0];
      
      const datesToUnblock = existingBlocked
        .map((r) => normalizeDate(r.date))
        .filter((d) => !blockedDates.has(d));

      console.log(`Property ${propertyId}: ${blockedDates.size} blocked dates from PMS, ${datesToUnblock.length} stale dates to unblock`);

      // Batch delete to avoid query limits
      if (datesToUnblock.length > 0) {
        const BATCH_SIZE = 100;
        for (let i = 0; i < datesToUnblock.length; i += BATCH_SIZE) {
          const batch = datesToUnblock.slice(i, i + BATCH_SIZE);
          const { error: deleteError } = await adminClient
            .from("availability")
            .delete()
            .eq("property_id", propertyId)
            .in("date", batch);

          if (deleteError) {
            console.warn(`Could not unblock dates batch ${i / BATCH_SIZE + 1}: ${deleteError.message}`);
          }
        }
      }
    }

    // Update last sync timestamp
    await adminClient
      .from("pms_property_map")
      .update({ last_availability_sync_at: new Date().toISOString() })
      .eq("property_id", propertyId);

    return { success: true, blockedDays: blockedDates.size, bookingResult };
  } catch (error) {
    return {
      success: false,
      blockedDays: 0,
      bookingResult,
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
        // Sync availability and extract bookings in one call
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
            errors.push(`Property ${mapping.external_property_id}: ${result.error}`);
          }
        }

        // Accumulate booking results
        bookingsCreated += result.bookingResult.created;
        bookingsUpdated += result.bookingResult.updated;
        
        if (result.bookingResult.errors.length > 0) {
          errors.push(...result.bookingResult.errors.slice(0, 3));
        }
      }

      // Update sync run
      if (syncRun) {
        const summaryParts: string[] = [];
        if (errors.length > 0) {
          summaryParts.push(errors.slice(0, 5).join("; "));
        }
        if (bookingsCreated > 0 || bookingsUpdated > 0) {
          summaryParts.push(`Bookings: +${bookingsCreated}, ~${bookingsUpdated}`);
        }

        await adminClient
          .from("pms_sync_runs")
          .update({
            status: failed === 0 ? "success" : synced > 0 ? "partial" : "failed",
            completed_at: new Date().toISOString(),
            records_processed: synced,
            records_failed: failed,
            error_summary: summaryParts.length > 0 ? summaryParts.join(" | ") : null,
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
