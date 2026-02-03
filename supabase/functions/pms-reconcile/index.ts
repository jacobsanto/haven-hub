import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TokeetInquiry {
  pkey: string;
  rental_id: string;
  arrive: number; // Unix timestamp
  depart: number; // Unix timestamp
  status: string;
  source: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  num_guests?: number;
  num_adults?: number;
  num_child?: number;
  booked_price?: number;
}

interface LocalBooking {
  id: string;
  property_id: string;
  external_booking_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  status: string;
  guest_name: string;
  guest_email: string;
  special_requests: string | null;
}

interface ReconciliationSummary {
  checked: number;
  modified: number;
  created: number;
  cancelled: number;
  errors: string[];
}

// Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Convert Unix timestamp to YYYY-MM-DD
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

// Get all dates between check-in and check-out (exclusive of check-out)
function getDateRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const current = new Date(start);
  
  while (current < end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const authHeader = req.headers.get("Authorization");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify authentication - either webhook token OR admin user
  const expectedToken = Deno.env.get("PMS_WEBHOOK_TOKEN");
  let isAuthorized = false;

  // Check webhook token first
  if (expectedToken && token && timingSafeEqual(token, expectedToken)) {
    isAuthorized = true;
  }

  // If no token, check for admin auth
  if (!isAuthorized && authHeader?.startsWith("Bearer ")) {
    const jwt = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(jwt);
    
    if (!claimsError && claimsData?.user) {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", claimsData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (roleData) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    console.error("Unauthorized - no valid token or admin session");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tokeetApiKey = Deno.env.get("TOKEET_API_KEY");
  const tokeetAccountId = Deno.env.get("TOKEET_ACCOUNT_ID");

  if (!tokeetApiKey || !tokeetAccountId) {
    console.error("Missing Tokeet credentials");
    return new Response(
      JSON.stringify({ error: "Missing Tokeet API configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const summary: ReconciliationSummary = {
    checked: 0,
    modified: 0,
    created: 0,
    cancelled: 0,
    errors: [],
  };

  try {
    // Parse request body (optional filters)
    let requestBody: { rental_id?: string } = {};
    try {
      requestBody = await req.json();
    } catch {
      // Empty body is fine
    }

    console.log("Starting daily booking reconciliation...");

    // Get active PMS connection
    const { data: connection, error: connError } = await supabase
      .from("pms_connections")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();

    if (connError || !connection) {
      console.error("No active PMS connection found");
      return new Response(
        JSON.stringify({ error: "No active PMS connection" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get property mappings
    const { data: mappings, error: mapError } = await supabase
      .from("pms_property_map")
      .select("property_id, external_property_id")
      .eq("pms_connection_id", connection.id)
      .eq("sync_enabled", true);

    if (mapError || !mappings || mappings.length === 0) {
      console.log("No property mappings to reconcile");
      return new Response(
        JSON.stringify({ success: true, summary, message: "No properties to reconcile" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build property lookup map (external_id -> local property_id)
    const propertyMap = new Map<string, string>();
    for (const m of mappings) {
      propertyMap.set(m.external_property_id, m.property_id);
    }

    // Fetch active bookings from Tokeet
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    // Tokeet uses Unix timestamps for from/to
    const fromTimestamp = Math.floor(new Date(today).getTime() / 1000);
    const toTimestamp = Math.floor(futureDate.getTime() / 1000);

    let allInquiries: TokeetInquiry[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const tokeetUrl = new URL("https://capi.tokeet.com/v1/inquiry");
      tokeetUrl.searchParams.set("account", tokeetAccountId);
      tokeetUrl.searchParams.set("from", fromTimestamp.toString());
      tokeetUrl.searchParams.set("to", toTimestamp.toString());
      tokeetUrl.searchParams.set("limit", limit.toString());
      tokeetUrl.searchParams.set("offset", offset.toString());

      console.log(`Fetching Tokeet inquiries, offset: ${offset}`);

      const tokeetResponse = await fetch(tokeetUrl.toString(), {
        headers: {
          Authorization: tokeetApiKey,
          "Content-Type": "application/json",
        },
      });

      if (!tokeetResponse.ok) {
        const errorText = await tokeetResponse.text();
        throw new Error(`Tokeet API error: ${tokeetResponse.status} - ${errorText}`);
      }

      const responseData = await tokeetResponse.json();
      
      // Tokeet API returns { items: [...] } or directly an array depending on endpoint
      const inquiries: TokeetInquiry[] = Array.isArray(responseData) 
        ? responseData 
        : (responseData.items || responseData.data || responseData.inquiries || []);
      
      console.log(`Received ${inquiries.length} inquiries from Tokeet`);
      
      // Filter to only booked/confirmed status
      const activeInquiries = inquiries.filter(
        (i) => i.status === "booked" || i.status === "confirmed"
      );
      
      allInquiries = [...allInquiries, ...activeInquiries];
      
      if (inquiries.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log(`Fetched ${allInquiries.length} active bookings from Tokeet`);

    // Filter to only properties we manage
    const relevantInquiries = allInquiries.filter((i) =>
      propertyMap.has(i.rental_id)
    );

    console.log(`${relevantInquiries.length} bookings match our properties`);

    // Build lookup map by pkey
    const tokeetBookings = new Map<string, TokeetInquiry>();
    for (const inquiry of relevantInquiries) {
      tokeetBookings.set(inquiry.pkey, inquiry);
    }

    // Load local bookings with external_booking_id
    const { data: localBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, property_id, external_booking_id, check_in, check_out, nights, status, guest_name, guest_email, special_requests")
      .not("external_booking_id", "is", null)
      .in("status", ["confirmed", "pending"])
      .gte("check_out", today);

    if (bookingsError) {
      throw new Error(`Failed to fetch local bookings: ${bookingsError.message}`);
    }

    const localBookingMap = new Map<string, LocalBooking>();
    for (const booking of localBookings || []) {
      if (booking.external_booking_id) {
        localBookingMap.set(booking.external_booking_id, booking as LocalBooking);
      }
    }

    console.log(`Found ${localBookingMap.size} local bookings with external IDs`);

    summary.checked = tokeetBookings.size;

    // Process each Tokeet booking
    for (const [pkey, inquiry] of tokeetBookings) {
      const propertyId = propertyMap.get(inquiry.rental_id);
      if (!propertyId) continue;

      const checkIn = unixToDateString(inquiry.arrive);
      const checkOut = unixToDateString(inquiry.depart);
      const nights = calculateNights(checkIn, checkOut);

      const localBooking = localBookingMap.get(pkey);

      if (localBooking) {
        // Check for date modifications
        if (localBooking.check_in !== checkIn || localBooking.check_out !== checkOut) {
          console.log(`Date modification detected for ${pkey}: ${localBooking.check_in}-${localBooking.check_out} -> ${checkIn}-${checkOut}`);

          try {
            // Update booking record
            const modificationNote = `[RECONCILIATION ${new Date().toISOString()}] Dates modified from ${localBooking.check_in} - ${localBooking.check_out} to ${checkIn} - ${checkOut}`;
            const updatedNotes = localBooking.special_requests
              ? `${localBooking.special_requests}\n\n${modificationNote}`
              : modificationNote;

            const { error: updateError } = await supabase
              .from("bookings")
              .update({
                check_in: checkIn,
                check_out: checkOut,
                nights,
                pms_synced_at: new Date().toISOString(),
                special_requests: updatedNotes,
              })
              .eq("id", localBooking.id);

            if (updateError) throw updateError;

            // Release old availability dates
            const oldDates = getDateRange(localBooking.check_in, localBooking.check_out);
            if (oldDates.length > 0) {
              await supabase
                .from("availability")
                .delete()
                .eq("property_id", localBooking.property_id)
                .in("date", oldDates)
                .eq("available", false);
            }

            // Block new dates
            const newDates = getDateRange(checkIn, checkOut);
            const availabilityRows = newDates.map((date) => ({
              property_id: propertyId,
              date,
              available: false,
            }));

            if (availabilityRows.length > 0) {
              // Use upsert to handle any existing records
              await supabase
                .from("availability")
                .upsert(availabilityRows, { onConflict: "property_id,date" });
            }

            // Log to audit trail
            await supabase.from("pms_raw_events").insert({
              pms_connection_id: connection.id,
              event_type: "reconciliation.modification",
              source: "pms-reconcile",
              payload: {
                booking_id: localBooking.id,
                external_id: pkey,
                old_dates: { check_in: localBooking.check_in, check_out: localBooking.check_out },
                new_dates: { check_in: checkIn, check_out: checkOut },
              },
              processed: true,
              processed_at: new Date().toISOString(),
            });

            summary.modified++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            console.error(`Failed to update booking ${pkey}:`, errorMsg);
            summary.errors.push(`Modification failed for ${pkey}: ${errorMsg}`);
          }
        }

        // Remove from local map (remaining will be considered potentially cancelled)
        localBookingMap.delete(pkey);
      } else {
        // New booking not in our system - create it
        console.log(`New OTA booking detected: ${pkey}`);

        try {
          const guestName = inquiry.guest_name || "OTA Guest";
          const guestEmail = inquiry.guest_email || `ota-${pkey}@placeholder.local`;

          const { error: insertError } = await supabase.from("bookings").insert({
            property_id: propertyId,
            external_booking_id: pkey,
            check_in: checkIn,
            check_out: checkOut,
            nights,
            guests: inquiry.num_guests || 1,
            adults: inquiry.num_adults || 1,
            children: inquiry.num_child || 0,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: inquiry.guest_phone || null,
            total_price: inquiry.booked_price || 0,
            status: "confirmed",
            source: inquiry.source?.toLowerCase() || "ota",
            payment_status: "paid",
            pms_sync_status: "synced",
            pms_synced_at: new Date().toISOString(),
            special_requests: `[RECONCILIATION] Created from OTA booking (${inquiry.source || "unknown"})`,
          });

          if (insertError) throw insertError;

          // Block availability
          const dates = getDateRange(checkIn, checkOut);
          const availabilityRows = dates.map((date) => ({
            property_id: propertyId,
            date,
            available: false,
          }));

          if (availabilityRows.length > 0) {
            await supabase
              .from("availability")
              .upsert(availabilityRows, { onConflict: "property_id,date" });
          }

          // Log to audit trail
          await supabase.from("pms_raw_events").insert({
            pms_connection_id: connection.id,
            event_type: "reconciliation.creation",
            source: "pms-reconcile",
            payload: {
              external_id: pkey,
              rental_id: inquiry.rental_id,
              property_id: propertyId,
              dates: { check_in: checkIn, check_out: checkOut },
              source: inquiry.source,
            },
            processed: true,
            processed_at: new Date().toISOString(),
          });

          summary.created++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error(`Failed to create booking ${pkey}:`, errorMsg);
          summary.errors.push(`Creation failed for ${pkey}: ${errorMsg}`);
        }
      }
    }

    // Remaining bookings in localBookingMap are not in Tokeet active list - may be cancelled
    for (const [externalId, booking] of localBookingMap) {
      // Only mark as cancelled if they're from OTA sources
      if (booking.status === "confirmed") {
        console.log(`Booking ${externalId} not found in Tokeet - marking as cancelled`);

        try {
          const { error: cancelError } = await supabase
            .from("bookings")
            .update({
              status: "cancelled",
              pms_synced_at: new Date().toISOString(),
              special_requests: booking.special_requests
                ? `${booking.special_requests}\n\n[RECONCILIATION ${new Date().toISOString()}] Cancelled - not found in PMS active list`
                : `[RECONCILIATION ${new Date().toISOString()}] Cancelled - not found in PMS active list`,
            })
            .eq("id", booking.id);

          if (cancelError) throw cancelError;

          // Release availability
          const dates = getDateRange(booking.check_in, booking.check_out);
          if (dates.length > 0) {
            await supabase
              .from("availability")
              .delete()
              .eq("property_id", booking.property_id)
              .in("date", dates)
              .eq("available", false);
          }

          // Log to audit trail
          await supabase.from("pms_raw_events").insert({
            pms_connection_id: connection.id,
            event_type: "reconciliation.cancellation",
            source: "pms-reconcile",
            payload: {
              booking_id: booking.id,
              external_id: externalId,
              reason: "Not found in PMS active bookings list",
            },
            processed: true,
            processed_at: new Date().toISOString(),
          });

          summary.cancelled++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error(`Failed to cancel booking ${externalId}:`, errorMsg);
          summary.errors.push(`Cancellation failed for ${externalId}: ${errorMsg}`);
        }
      }
    }

    console.log("Reconciliation complete:", summary);

    return new Response(
      JSON.stringify({
        success: summary.errors.length === 0,
        summary,
        message: `Checked ${summary.checked} bookings: ${summary.modified} modified, ${summary.created} created, ${summary.cancelled} cancelled`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reconciliation error:", error);
    summary.errors.push(error instanceof Error ? error.message : "Unknown error");

    return new Response(
      JSON.stringify({ success: false, summary, error: summary.errors[0] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
