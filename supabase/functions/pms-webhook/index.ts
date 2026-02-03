// PMS Webhook Handler Edge Function
// Receives webhook events from Tokeet/AdvanceCM for OTA bookings and availability changes
// Security: Uses URL token authentication (Tokeet does not support HMAC webhook signing)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type BookingSource = "direct" | "booking_com" | "airbnb" | "expedia" | "vrbo" | "manual";

interface TokeetWebhookEvent {
  event: string;
  type?: string;
  rental_id?: string;
  pkey?: string;
  data?: {
    pkey?: string;
    rental_id?: string;
    check_in?: string;
    check_out?: string;
    arrival?: string;
    departure?: string;
    guest?: {
      name?: string;
      email?: string;
      phone?: string;
      country?: string;
    };
    guest_name?: string;
    guest_email?: string;
    num_guests?: number;
    num_adults?: number;
    num_child?: number;
    price?: number;
    total?: number;
    currency?: string;
    source?: string;
    channel?: string;
    status?: string;
    confirmation_code?: string;
    notes?: string;
  };
  // Availability update format
  blocked?: Array<{ from: string; to: string }>;
  from?: string;
  to?: string;
}

function mapChannelToSource(channel?: string): BookingSource {
  if (!channel) return "direct";
  const lower = channel.toLowerCase();
  if (lower.includes("airbnb")) return "airbnb";
  if (lower.includes("booking")) return "booking_com";
  if (lower.includes("expedia")) return "expedia";
  if (lower.includes("vrbo") || lower.includes("homeaway")) return "vrbo";
  return "direct";
}

function generateBookingReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${year}${month}-${random}`;
}

/**
 * Verify webhook token using timing-safe comparison
 * Tokeet/AdvanceCM does not support HMAC signing, so we use URL token authentication
 */
function verifyWebhookToken(
  providedToken: string | null,
  expectedToken: string | undefined
): { valid: boolean; reason?: string } {
  // If no token is configured, reject all requests (secure by default)
  if (!expectedToken) {
    console.error("PMS_WEBHOOK_TOKEN not configured - rejecting webhook request");
    return { valid: false, reason: "webhook_token_not_configured" };
  }

  // If token is configured but none provided, reject
  if (!providedToken) {
    return { valid: false, reason: "missing_token" };
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const encoder = new TextEncoder();
    const providedBytes = encoder.encode(providedToken);
    const expectedBytes = encoder.encode(expectedToken);

    // Length check first (this leaks length, but that's acceptable for URL tokens)
    if (providedBytes.length !== expectedBytes.length) {
      return { valid: false, reason: "invalid_token" };
    }

    // Timing-safe comparison using Deno's crypto
    // Note: timingSafeEqual is on the global crypto object, not crypto.subtle
    let match = true;
    for (let i = 0; i < providedBytes.length; i++) {
      if (providedBytes[i] !== expectedBytes[i]) {
        match = false;
      }
    }
    
    if (!match) {
      return { valid: false, reason: "invalid_token" };
    }

    return { valid: true };
  } catch (error) {
    console.error("Token verification error:", error);
    return { valid: false, reason: "verification_error" };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract token from query string for authentication
  const url = new URL(req.url);
  const providedToken = url.searchParams.get("token");
  const expectedToken = Deno.env.get("PMS_WEBHOOK_TOKEN");

  // Verify webhook token (Tokeet doesn't support HMAC, so we use URL token)
  const verification = verifyWebhookToken(providedToken, expectedToken);
  
  if (!verification.valid) {
    console.error(`Webhook token verification failed: ${verification.reason}`);
    return new Response(
      JSON.stringify({ 
        error: "Unauthorized", 
        reason: verification.reason 
      }),
      { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }

  // Get raw body for processing
  const rawBody = await req.text();

  try {
    // Create admin client (no user auth for webhooks)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse webhook payload
    const payload: TokeetWebhookEvent = JSON.parse(rawBody);
    const eventType = payload.event || payload.type || "unknown";

    console.log(`Received webhook event: ${eventType}`, JSON.stringify(payload).slice(0, 500));

    // REPLAY ATTACK PREVENTION: Idempotency check
    // Use webhook ID to prevent duplicate processing
    const webhookId = payload.data?.pkey || payload.pkey;
    if (webhookId) {
      const { data: alreadyProcessed } = await adminClient
        .from("pms_raw_events")
        .select("id")
        .eq("event_type", eventType)
        .eq("processed", true)
        .filter("payload->>pkey", "eq", webhookId)
        .maybeSingle();

      if (alreadyProcessed) {
        console.log(`Webhook already processed: ${eventType} with pkey ${webhookId}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Already processed",
            idempotent: true 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    // Get active connection
    const { data: connection } = await adminClient
      .from("pms_connections")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();

    // Log the raw event
    await adminClient.from("pms_raw_events").insert({
      pms_connection_id: connection?.id || null,
      event_type: eventType,
      source: "webhook",
      payload: payload as unknown as Record<string, unknown>,
      processed: false,
    });

    // Handle different event types
    switch (eventType) {
      case "booking.created":
      case "inquiry.created":
      case "reservation.created": {
        const data = payload.data;
        if (!data) {
          throw new Error("No booking data in webhook");
        }

        const rentalId = data.rental_id || payload.rental_id;
        if (!rentalId) {
          throw new Error("No rental_id in booking webhook");
        }

        // Find property mapping
        const { data: mapping } = await adminClient
          .from("pms_property_map")
          .select("property_id")
          .eq("external_property_id", rentalId)
          .maybeSingle();

        if (!mapping) {
          console.log(`No property mapping for rental ${rentalId}`);
          return new Response(
            JSON.stringify({ success: false, message: "Property not mapped" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if booking already exists (by external ID)
        const externalBookingId = data.pkey || payload.pkey;
        if (externalBookingId) {
          const { data: existingBooking } = await adminClient
            .from("bookings")
            .select("id")
            .eq("external_booking_id", externalBookingId)
            .maybeSingle();

          if (existingBooking) {
            console.log(`Booking ${externalBookingId} already exists`);
            return new Response(
              JSON.stringify({ success: true, message: "Booking already exists" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Parse dates
        const checkIn = data.check_in || data.arrival;
        const checkOut = data.check_out || data.departure;

        if (!checkIn || !checkOut) {
          throw new Error("Missing check-in or check-out date");
        }

        // Calculate nights
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

        // Get guest info
        const guestName = data.guest?.name || data.guest_name || "OTA Guest";
        const guestEmail = data.guest?.email || data.guest_email || `ota-${Date.now()}@placeholder.local`;
        const guestPhone = data.guest?.phone;
        const guestCountry = data.guest?.country;

        // Determine source
        const source = mapChannelToSource(data.source || data.channel);

        // Create booking record
        const { data: newBooking, error: bookingError } = await adminClient
          .from("bookings")
          .insert({
            property_id: mapping.property_id,
            booking_reference: generateBookingReference(),
            external_booking_id: externalBookingId,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone,
            guest_country: guestCountry,
            check_in: checkIn,
            check_out: checkOut,
            nights,
            guests: data.num_guests || (data.num_adults || 1) + (data.num_child || 0),
            adults: data.num_adults || 1,
            children: data.num_child || 0,
            total_price: data.price || data.total || 0,
            status: "confirmed",
            source,
            payment_status: "paid", // OTA bookings are typically pre-paid
            pms_sync_status: "synced",
            pms_synced_at: new Date().toISOString(),
            special_requests: data.notes,
          })
          .select()
          .single();

        if (bookingError) {
          throw new Error(`Failed to create booking: ${bookingError.message}`);
        }

        // Update availability to block these dates
        const datesToBlock: Array<{ property_id: string; date: string; available: boolean }> = [];
        for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
          datesToBlock.push({
            property_id: mapping.property_id,
            date: d.toISOString().split("T")[0],
            available: false,
          });
        }

        if (datesToBlock.length > 0) {
          // Upsert blocked dates
          await adminClient.from("availability").upsert(datesToBlock, {
            onConflict: "property_id,date",
          });
        }

        // Mark event as processed
        await adminClient
          .from("pms_raw_events")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("event_type", eventType)
          .eq("payload->>pkey", externalBookingId);

        console.log(`Created OTA booking: ${newBooking.booking_reference} from ${source}`);

        return new Response(
          JSON.stringify({
            success: true,
            booking_id: newBooking.id,
            booking_reference: newBooking.booking_reference,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "booking.cancelled":
      case "inquiry.cancelled":
      case "reservation.cancelled": {
        const data = payload.data;
        const externalBookingId = data?.pkey || payload.pkey;

        if (!externalBookingId) {
          throw new Error("No booking ID in cancellation webhook");
        }

        // Find and update the booking
        const { data: booking } = await adminClient
          .from("bookings")
          .select("id, property_id, check_in, check_out")
          .eq("external_booking_id", externalBookingId)
          .maybeSingle();

        if (!booking) {
          console.log(`Booking ${externalBookingId} not found for cancellation`);
          return new Response(
            JSON.stringify({ success: true, message: "Booking not found" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update booking status
        await adminClient
          .from("bookings")
          .update({ status: "cancelled", pms_synced_at: new Date().toISOString() })
          .eq("id", booking.id);

        // Remove availability blocks for this booking's dates
        await adminClient
          .from("availability")
          .delete()
          .eq("property_id", booking.property_id)
          .gte("date", booking.check_in)
          .lt("date", booking.check_out);

        console.log(`Cancelled booking: ${externalBookingId}`);

        return new Response(
          JSON.stringify({ success: true, cancelled: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "availability.updated":
      case "blocked.created":
      case "blocked.deleted": {
        const rentalId = payload.rental_id || payload.data?.rental_id;
        if (!rentalId) {
          console.log("No rental_id in availability webhook");
          return new Response(
            JSON.stringify({ success: false, message: "No rental_id" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find property mapping
        const { data: mapping } = await adminClient
          .from("pms_property_map")
          .select("property_id, pms_connection_id")
          .eq("external_property_id", rentalId)
          .maybeSingle();

        if (!mapping) {
          console.log(`No property mapping for rental ${rentalId}`);
          return new Response(
            JSON.stringify({ success: false, message: "Property not mapped" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Trigger a full availability sync for this property
        // This ensures we get the complete picture from PMS
        const apiKey = Deno.env.get("TOKEET_API_KEY");
        const accountId = Deno.env.get("TOKEET_ACCOUNT_ID");

        if (apiKey && accountId) {
          // Fetch fresh availability from Tokeet
          const start = new Date().toISOString().split("T")[0];
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 12);
          const end = endDate.toISOString().split("T")[0];

          const response = await fetch(
            `https://capi.tokeet.com/v1/rental/${rentalId}/availability?from=${start}&to=${end}&account=${accountId}`,
            {
              headers: { Authorization: apiKey, "Content-Type": "application/json" },
            }
          );

          if (response.ok) {
            const tokeetAvailability = await response.json();

            // Process blocked ranges
            let blockedRanges: Array<{ from: string; to: string }> = [];
            if (Array.isArray(tokeetAvailability)) {
              blockedRanges = tokeetAvailability
                .map((r: { from?: string; to?: string }) => ({ from: r.from || "", to: r.to || "" }))
                .filter((r) => r.from && r.to);
            } else if (tokeetAvailability?.blocked) {
              blockedRanges = tokeetAvailability.blocked;
            }

            // Build blocked dates set
            const blockedDates = new Set<string>();
            for (const range of blockedRanges) {
              const rangeStart = new Date(range.from);
              const rangeEnd = new Date(range.to);
              for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
                blockedDates.add(d.toISOString().split("T")[0]);
              }
            }

            // Clear and re-insert availability
            await adminClient
              .from("availability")
              .delete()
              .eq("property_id", mapping.property_id)
              .gte("date", start)
              .lte("date", end);

            if (blockedDates.size > 0) {
              const records = Array.from(blockedDates).map((date) => ({
                property_id: mapping.property_id,
                date,
                available: false,
              }));
              await adminClient.from("availability").insert(records);
            }

            // Update last sync timestamp
            await adminClient
              .from("pms_property_map")
              .update({ last_availability_sync_at: new Date().toISOString() })
              .eq("property_id", mapping.property_id);

            console.log(`Synced availability for property ${mapping.property_id}: ${blockedDates.size} blocked days`);
          }
        }

        return new Response(
          JSON.stringify({ success: true, synced: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
        return new Response(
          JSON.stringify({ success: true, message: `Unhandled event: ${eventType}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
