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

// Tokeet Inquiry API returns actual booking dates
interface TokeetInquiry {
  pkey: string;
  rental_id: string;
  // Tokeet uses various field names for dates
  arrive?: number; // Unix timestamp (older API)
  depart?: number; // Unix timestamp (older API)
  guest_arrive?: number; // Unix timestamp (newer API)
  guest_depart?: number; // Unix timestamp (newer API)
  check_in?: number; // Unix timestamp (also used)
  check_out?: number; // Unix timestamp (also used)
  status: string;
  source?: string;
  inquiry_source?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  num_guests?: number;
  num_adults?: number;
  num_child?: number;
  booked_price?: number;
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

function mapSourceToBookingSource(source: string | undefined): string {
  if (!source) return "direct";
  const sourceLower = source.toLowerCase();
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

// Convert Unix timestamp (seconds) to YYYY-MM-DD
function unixToDateString(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split("T")[0];
}

// Calculate nights between two dates
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// Fetch bookings from Tokeet Inquiry API (accurate check-in/check-out dates)
async function syncBookingsFromInquiryAPI(
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

    // Fetch active inquiries for this property
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 12);
    
    const fromTimestamp = Math.floor(new Date(today).getTime() / 1000);
    const toTimestamp = Math.floor(futureDate.getTime() / 1000);

    const tokeetUrl = new URL("https://capi.tokeet.com/v1/inquiry");
    tokeetUrl.searchParams.set("account", accountId);
    tokeetUrl.searchParams.set("rental_id", externalPropertyId);
    tokeetUrl.searchParams.set("from", fromTimestamp.toString());
    tokeetUrl.searchParams.set("to", toTimestamp.toString());
    tokeetUrl.searchParams.set("limit", "100");

    const response = await fetch(tokeetUrl.toString(), {
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      result.errors.push(`Inquiry API error: ${response.status}`);
      return result;
    }

    const responseData = await response.json();
    
    console.log(`Property ${propertyId}: Inquiry API raw response: ${JSON.stringify(responseData).substring(0, 500)}`);
    
    const inquiries: TokeetInquiry[] = Array.isArray(responseData)
      ? responseData
      : (responseData.items || responseData.data || responseData.inquiries || []);

    // Filter to only booked/confirmed/accept status
    // Tokeet uses "accept" for confirmed bookings, not "booked" or "confirmed"
    const activeInquiries = inquiries.filter(
      (i) => i.status === "accept" || i.status === "booked" || i.status === "confirmed"
    );

    console.log(`Property ${propertyId}: ${inquiries.length} total inquiries, ${activeInquiries.length} active (booked/confirmed)`);

    if (activeInquiries.length === 0) {
      return result;
    }

    console.log(`Property ${propertyId}: Found ${activeInquiries.length} active bookings from Inquiry API`);

    // Get existing bookings for this property by pkey (external_booking_id)
    const pkeys = activeInquiries.map((i) => i.pkey);
    const { data: existingBookings } = await adminClient
      .from("bookings")
      .select("id, external_booking_id, check_in, check_out, guest_name")
      .eq("property_id", propertyId)
      .in("status", ["confirmed", "pending"]);

    // Build map by pkey for quick lookup
    const existingByPkey = new Map(
      (existingBookings || [])
        .filter((b) => b.external_booking_id && pkeys.includes(b.external_booking_id))
        .map((b) => [b.external_booking_id, b])
    );
    
    // Also build a map for legacy bookings (using old-style external_booking_id or no external ID)
    // to migrate them to pkey format
    const legacyBookings = (existingBookings || []).filter(
      (b) => !b.external_booking_id || b.external_booking_id.startsWith("tokeet-")
    );

    // Process each inquiry
    for (const inquiry of activeInquiries) {
      try {
        // Get timestamps - Tokeet uses different field names
        const arriveTs = inquiry.guest_arrive || inquiry.arrive || inquiry.check_in;
        const departTs = inquiry.guest_depart || inquiry.depart || inquiry.check_out;
        
        if (!arriveTs || !departTs) {
          console.log(`Property ${propertyId}: Skipping inquiry ${inquiry.pkey} - missing dates`);
          continue;
        }

        // Convert Unix timestamps to date strings
        const checkIn = unixToDateString(arriveTs);
        const checkOut = unixToDateString(departTs);
        const nights = calculateNights(checkIn, checkOut);

        // Skip past bookings
        if (new Date(checkOut) < new Date()) continue;

        // First check if booking exists by pkey
        let existing = existingByPkey.get(inquiry.pkey);
        
        // If not found by pkey, check for legacy booking by guest name + overlapping dates
        if (!existing) {
          const guestName = inquiry.guest_name || "";
          const legacyMatch = legacyBookings.find((b) => {
            // Match by similar guest name (case-insensitive partial match)
            const nameMatch = b.guest_name && guestName && 
              (b.guest_name.toLowerCase().includes(guestName.toLowerCase()) ||
               guestName.toLowerCase().includes(b.guest_name.toLowerCase()));
            
            // Match by overlapping dates (check-in within 1 day)
            const checkInDate = new Date(checkIn);
            const existingCheckIn = new Date(b.check_in);
            const dateDiff = Math.abs(checkInDate.getTime() - existingCheckIn.getTime()) / (1000 * 60 * 60 * 24);
            const dateMatch = dateDiff <= 1;
            
            return nameMatch && dateMatch;
          });
          
          if (legacyMatch) {
            existing = legacyMatch;
            console.log(`Property ${propertyId}: Found legacy booking ${legacyMatch.id} matching inquiry ${inquiry.pkey} (${guestName})`);
          }
        }

        if (existing) {
          // Update booking - fix dates AND migrate to new pkey format
          const needsUpdate = 
            existing.check_in !== checkIn || 
            existing.check_out !== checkOut ||
            existing.external_booking_id !== inquiry.pkey;
          
          if (needsUpdate) {
            console.log(`Property ${propertyId}: Updating booking ${existing.id} -> pkey:${inquiry.pkey}, dates: ${existing.check_in}-${existing.check_out} -> ${checkIn}-${checkOut}`);
            
            const { error } = await adminClient
              .from("bookings")
              .update({
                check_in: checkIn,
                check_out: checkOut,
                nights,
                external_booking_id: inquiry.pkey, // Migrate to new pkey format
                pms_synced_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            if (error) {
              result.errors.push(`Update ${inquiry.pkey}: ${error.message}`);
            } else {
              result.updated++;
              // Remove from legacy list to avoid re-matching
              const idx = legacyBookings.indexOf(existing);
              if (idx > -1) legacyBookings.splice(idx, 1);
            }
          }
        } else {
          // Create new booking with accurate dates from Inquiry API
          const guestName = inquiry.guest_name || "OTA Guest";
          const source = mapSourceToBookingSource(inquiry.inquiry_source || inquiry.source);

          const bookingData = {
            property_id: propertyId,
            external_booking_id: inquiry.pkey,
            booking_reference: generateBookingReference(),
            guest_name: guestName,
            guest_email: inquiry.guest_email || `ota-${inquiry.pkey}@placeholder.local`,
            guest_phone: inquiry.guest_phone || null,
            check_in: checkIn,
            check_out: checkOut,
            nights,
            guests: inquiry.num_guests || 2,
            adults: inquiry.num_adults || 2,
            children: inquiry.num_child || 0,
            total_price: inquiry.booked_price || 0,
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
              result.errors.push(`Create ${inquiry.pkey}: ${error.message}`);
            }
          } else {
            result.created++;
          }
        }
      } catch (inquiryError) {
        result.errors.push(
          `Process inquiry ${inquiry.pkey}: ${inquiryError instanceof Error ? inquiryError.message : "Unknown error"}`
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

    // STEP 1: Sync bookings from Inquiry API (accurate check-in/check-out dates)
    const extractedBookings = await syncBookingsFromInquiryAPI(
      supabaseUrl,
      serviceRoleKey,
      propertyId,
      externalPropertyId,
      apiKey,
      accountId
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
    // TOKEET FIX: The Availability API returns dates shifted -1 day from reality
    // e.g., a booking for Feb 11-14 shows as from: "2026-02-10", to: "2026-02-11"
    // We need to shift both dates by +1 day to get the actual blocked dates
    // 
    // Additionally, Tokeet returns "to" as the first day AFTER the block ends,
    // so we include from (corrected) through to-1 (corrected, exclusive)
    const blockedDates = new Set<string>();
    for (const range of blockedRanges) {
      // Apply +1 day correction to Tokeet Availability API dates
      const rawFrom = new Date(range.from);
      const rawTo = new Date(range.to);
      
      // Shift dates by +1 day to match Tokeet UI reality
      const correctedFrom = new Date(rawFrom);
      correctedFrom.setDate(correctedFrom.getDate() + 1);
      
      const correctedTo = new Date(rawTo);
      correctedTo.setDate(correctedTo.getDate() + 1);
      
      console.log(`Property: Date correction: raw ${range.from}-${range.to} -> corrected ${correctedFrom.toISOString().split("T")[0]}-${correctedTo.toISOString().split("T")[0]}`);
      
      // Block from corrected check-in through day BEFORE corrected check-out
      // This allows same-day turnovers where checkout = new check-in
      for (let d = new Date(correctedFrom); d < correctedTo; d.setDate(d.getDate() + 1)) {
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
