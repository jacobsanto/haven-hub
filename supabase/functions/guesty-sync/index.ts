import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Zod Validation ----------

const baseRequestSchema = z.object({
  action: z.enum([
    "test",
    "fetch-properties",
    "fetch-property",
    "fetch-availability",
    "sync-availability",
    "import-property",
    "create-booking",
    "cancel-booking",
  ]),
});

const fetchPropertySchema = baseRequestSchema.extend({
  action: z.literal("fetch-property"),
  externalId: z.string().min(1).max(200),
});

const fetchAvailabilitySchema = baseRequestSchema.extend({
  action: z.literal("fetch-availability"),
  externalId: z.string().min(1).max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const importPropertySchema = baseRequestSchema.extend({
  action: z.literal("import-property"),
  propertyData: z.object({
    _id: z.string(),
    title: z.string().optional(),
    nickname: z.string().optional(),
  }).passthrough(),
  connectionId: z.string().uuid(),
});

const createBookingSchema = baseRequestSchema.extend({
  action: z.literal("create-booking"),
  externalPropertyId: z.string().min(1).max(200),
  bookingReference: z.string().max(50).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().positive().max(50).optional(),
  adults: z.number().int().positive().max(50).optional(),
  children: z.number().int().min(0).max(50).optional(),
  guestInfo: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email().max(255),
    phone: z.string().max(50).optional(),
    country: z.string().max(100).optional(),
  }),
  totalPrice: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  priceBreakdownNotes: z.string().max(2000).optional(),
});

const cancelBookingSchema = baseRequestSchema.extend({
  action: z.literal("cancel-booking"),
  externalBookingId: z.string().min(1).max(200),
  cancellationReason: z.string().max(500).optional(),
});

interface SyncRequest {
  action: string;
  externalId?: string;
  startDate?: string;
  endDate?: string;
  propertyData?: GuestyListing;
  connectionId?: string;
  propertyId?: string;
  externalPropertyId?: string;
  bookingReference?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  adults?: number;
  children?: number;
  guestInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
  };
  totalPrice?: number;
  currency?: string;
  priceBreakdownNotes?: string;
  externalBookingId?: string;
  cancellationReason?: string;
}

function validateRequest(body: unknown): { success: true; data: SyncRequest } | { success: false; error: string } {
  const baseResult = baseRequestSchema.safeParse(body);
  if (!baseResult.success) return { success: false, error: "Invalid action" };

  const action = baseResult.data.action;
  let result;
  switch (action) {
    case "test":
    case "fetch-properties":
    case "sync-availability":
      result = baseRequestSchema.safeParse(body);
      break;
    case "fetch-property":
      result = fetchPropertySchema.safeParse(body);
      break;
    case "fetch-availability":
      result = fetchAvailabilitySchema.safeParse(body);
      break;
    case "import-property":
      result = importPropertySchema.safeParse(body);
      break;
    case "create-booking":
      result = createBookingSchema.safeParse(body);
      break;
    case "cancel-booking":
      result = cancelBookingSchema.safeParse(body);
      break;
    default:
      return { success: false, error: "Unknown action" };
  }

  if (!result.success) {
    return { success: false, error: result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ") };
  }
  return { success: true, data: body as SyncRequest };
}

// ---------- Guesty types ----------

interface GuestyListing {
  _id: string;
  title?: string;
  nickname?: string;
  publicDescription?: { summary?: string; space?: string };
  bedrooms?: number;
  bathrooms?: number;
  accommodates?: number;
  propertyType?: string;
  address?: {
    full?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  tags?: string[];
  pictures?: Array<{ original?: string; thumbnail?: string }>;
  prices?: { basePrice?: number; currency?: string };
}

// ---------- Guesty OAuth ----------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getGuestyAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get("GUESTY_CLIENT_ID");
  const clientSecret = Deno.env.get("GUESTY_API_TOKEN");

  if (!clientId || !clientSecret) {
    throw new Error("Guesty credentials not configured (GUESTY_CLIENT_ID / GUESTY_API_TOKEN)");
  }

  const response = await fetch("https://booking.guesty.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "booking_engine:api",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Guesty OAuth failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return cachedToken.token;
}

async function callGuestyAPI(path: string, method = "GET", body?: unknown): Promise<Response> {
  const token = await getGuestyAccessToken();
  const url = `https://booking.guesty.com/api/v1${path}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }
  return await fetch(url, options);
}

// ---------- Helpers ----------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapPropertyType(type?: string): string {
  if (!type) return "villa";
  const t = type.toLowerCase();
  if (t.includes("apartment") || t.includes("condo")) return "apartment";
  if (t.includes("cottage")) return "cottage";
  if (t.includes("penthouse")) return "penthouse";
  if (t.includes("estate")) return "estate";
  return "villa";
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.json();
    const validationResult = validateRequest(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validationResult.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SyncRequest = validationResult.data;
    const { action } = body;

    switch (action) {
      // ----- TEST -----
      case "test": {
        const response = await callGuestyAPI("/listings?limit=1&fields=_id");
        const success = response.ok;
        if (!success) {
          const errText = await response.text();
          return new Response(
            JSON.stringify({ success: false, message: `Connection failed: ${errText}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        await response.text(); // consume body
        return new Response(
          JSON.stringify({ success: true, message: "Connection successful" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----- FETCH PROPERTIES -----
      case "fetch-properties": {
        // Guesty paginates; fetch up to 200
        const allListings: GuestyListing[] = [];
        let skip = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore && skip < 500) {
          const response = await callGuestyAPI(`/listings?limit=${limit}&skip=${skip}&fields=_id,title,nickname,publicDescription,bedrooms,bathrooms,accommodates,propertyType,address,tags,pictures,prices`);
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Guesty API error: ${errText}`);
          }
          const data = await response.json();
          const results: GuestyListing[] = data.results || data || [];
          allListings.push(...results);
          hasMore = results.length === limit;
          skip += limit;
        }

        const properties = allListings.map((listing) => ({
          externalId: listing._id,
          name: listing.title || listing.nickname || "Unnamed Property",
          description: listing.publicDescription?.summary || null,
          bedrooms: listing.bedrooms || 1,
          bathrooms: listing.bathrooms || 1,
          maxGuests: listing.accommodates || 2,
          city: listing.address?.city || "Unknown",
          region: listing.address?.state || null,
          country: listing.address?.country || "Unknown",
          propertyType: mapPropertyType(listing.propertyType),
          highlights: listing.tags || [],
          images: listing.pictures?.map((p) => p.original || p.thumbnail || "").filter(Boolean) || [],
          coordinates: listing.address?.lat
            ? { lat: listing.address.lat, lng: listing.address.lng }
            : null,
          baserate: listing.prices?.basePrice
            ? { nightly: listing.prices.basePrice, minStay: 1 }
            : null,
        }));

        return new Response(
          JSON.stringify({ success: true, properties }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----- FETCH PROPERTY -----
      case "fetch-property": {
        const { externalId } = body;
        if (!externalId) throw new Error("externalId is required");

        const response = await callGuestyAPI(`/listings/${externalId}`);
        if (!response.ok) throw new Error(`Guesty API error: ${response.statusText}`);
        const listing: GuestyListing = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            property: {
              externalId: listing._id,
              name: listing.title || listing.nickname || "Unnamed Property",
              description: listing.publicDescription?.summary || null,
              bedrooms: listing.bedrooms || 1,
              bathrooms: listing.bathrooms || 1,
              maxGuests: listing.accommodates || 2,
              city: listing.address?.city || "Unknown",
              region: listing.address?.state || null,
              country: listing.address?.country || "Unknown",
              propertyType: mapPropertyType(listing.propertyType),
              highlights: listing.tags || [],
              images: listing.pictures?.map((p) => p.original || "").filter(Boolean) || [],
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----- FETCH AVAILABILITY -----
      case "fetch-availability": {
        const { externalId, startDate, endDate } = body;
        if (!externalId) throw new Error("externalId is required");

        const start = startDate || new Date().toISOString().split("T")[0];
        const endDt = endDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 12); return d.toISOString().split("T")[0]; })();

        const response = await callGuestyAPI(
          `/availability-pricing/api/calendar/listings/${externalId}?startDate=${start}&endDate=${endDt}`
        );
        if (!response.ok) throw new Error(`Guesty API error: ${response.statusText}`);
        const availability = await response.json();

        return new Response(
          JSON.stringify({ success: true, availability }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----- IMPORT PROPERTY -----
      case "import-property": {
        const { propertyData, connectionId } = body;
        if (!propertyData || !connectionId) throw new Error("propertyData and connectionId are required");

        const listing = propertyData as GuestyListing;
        const slug = generateSlug(listing.title || listing.nickname || "property");

        const { data: newProperty, error: propertyError } = await supabase
          .from("properties")
          .insert({
            name: listing.title || listing.nickname || "Unnamed Property",
            slug: slug + "-" + Date.now(),
            description: listing.publicDescription?.summary || null,
            city: listing.address?.city || "Unknown",
            region: listing.address?.state || null,
            country: listing.address?.country || "Unknown",
            bedrooms: listing.bedrooms || 1,
            bathrooms: listing.bathrooms || 1,
            max_guests: listing.accommodates || 2,
            property_type: mapPropertyType(listing.propertyType),
            highlights: listing.tags || [],
            gallery: listing.pictures?.map((p) => p.original || "").filter(Boolean) || [],
            base_price: 0,
            status: "draft",
          })
          .select()
          .single();

        if (propertyError) throw new Error(`Failed to create property: ${propertyError.message}`);

        const { error: mappingError } = await supabase
          .from("pms_property_map")
          .insert({
            pms_connection_id: connectionId,
            property_id: newProperty.id,
            external_property_id: listing._id,
            external_property_name: listing.title || listing.nickname,
            sync_enabled: true,
          });

        if (mappingError) {
          await supabase.from("properties").delete().eq("id", newProperty.id);
          throw new Error(`Failed to create mapping: ${mappingError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            property: newProperty,
            message: `Imported ${listing.title} as draft.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----- SYNC AVAILABILITY -----
      case "sync-availability": {
        const { propertyId, startDate, endDate } = body;
        if (!propertyId) throw new Error("propertyId is required");

        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Get mapping
        const { data: mapping, error: mappingError } = await adminClient
          .from("pms_property_map")
          .select("external_property_id")
          .eq("property_id", propertyId)
          .maybeSingle();

        if (mappingError || !mapping) throw new Error("Property not mapped to PMS");

        const externalPropertyId = mapping.external_property_id;
        const start = startDate || new Date().toISOString().split("T")[0];
        const endDtObj = endDate ? new Date(endDate) : new Date();
        if (!endDate) endDtObj.setMonth(endDtObj.getMonth() + 12);
        const end = endDtObj.toISOString().split("T")[0];

        // Fetch calendar from Guesty
        const response = await callGuestyAPI(
          `/availability-pricing/api/calendar/listings/${externalPropertyId}?startDate=${start}&endDate=${end}`
        );
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Guesty calendar API error: ${errText}`);
        }

        const calendarData = await response.json();

        // Guesty calendar returns { data: { days: { "YYYY-MM-DD": { status, ... } } } }
        // or an array of day objects. Parse both formats.
        const blockedDates = new Set<string>();

        if (calendarData?.data?.days && typeof calendarData.data.days === "object") {
          // Object keyed by date
          for (const [dateStr, dayInfo] of Object.entries(calendarData.data.days)) {
            const info = dayInfo as { status?: string; available?: boolean; listingId?: string };
            if (info.status === "booked" || info.status === "blocked" || info.available === false) {
              blockedDates.add(dateStr);
            }
          }
        } else if (Array.isArray(calendarData?.data)) {
          // Array of day objects
          for (const day of calendarData.data) {
            if (day.status === "booked" || day.status === "blocked" || day.available === false) {
              blockedDates.add(day.date);
            }
          }
        } else if (Array.isArray(calendarData)) {
          for (const day of calendarData) {
            if (day.status === "booked" || day.status === "blocked" || day.available === false) {
              blockedDates.add(day.date);
            }
          }
        }

        // Build availability records (only blocked dates)
        const availabilityRecords: Array<{ property_id: string; date: string; available: boolean }> = [];
        for (const dateStr of blockedDates) {
          availabilityRecords.push({
            property_id: propertyId,
            date: dateStr,
            available: false,
          });
        }

        // Clear existing and insert
        await adminClient
          .from("availability")
          .delete()
          .eq("property_id", propertyId)
          .gte("date", start)
          .lte("date", end);

        if (availabilityRecords.length > 0) {
          // Insert in batches of 500
          for (let i = 0; i < availabilityRecords.length; i += 500) {
            const batch = availabilityRecords.slice(i, i + 500);
            const { error: insertError } = await adminClient
              .from("availability")
              .insert(batch);
            if (insertError) throw new Error(`Failed to insert availability: ${insertError.message}`);
          }
        }

        // Update last sync timestamp
        await adminClient
          .from("pms_property_map")
          .update({ last_availability_sync_at: new Date().toISOString() })
          .eq("property_id", propertyId);

        const startDt = new Date(start);
        const endDt2 = new Date(end);
        return new Response(
          JSON.stringify({
            success: true,
            daysProcessed: Math.ceil((endDt2.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)),
            blockedDaysFound: blockedDates.size,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----- CREATE BOOKING -----
      case "create-booking": {
        const { externalPropertyId, checkIn, checkOut, guests, adults, children, guestInfo, totalPrice, currency, bookingReference, priceBreakdownNotes } = body;
        if (!externalPropertyId || !checkIn || !checkOut || !guestInfo) {
          throw new Error("Missing required booking fields");
        }

        const reservationPayload = {
          listingId: externalPropertyId,
          checkInDateLocalized: checkIn,
          checkOutDateLocalized: checkOut,
          status: "confirmed",
          money: {
            fareAccommodation: totalPrice || 0,
            currency: currency || "EUR",
          },
          guest: {
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            email: guestInfo.email,
            phone: guestInfo.phone || "",
          },
          guestsCount: guests || (adults || 1) + (children || 0),
          source: "Direct Website",
          confirmationCode: bookingReference,
          note: priceBreakdownNotes || "",
        };

        const response = await callGuestyAPI("/reservations", "POST", reservationPayload);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create reservation in Guesty: ${errorText}`);
        }

        const resData = await response.json();
        return new Response(
          JSON.stringify({
            success: true,
            externalBookingId: resData._id || resData.id,
            message: "Booking pushed to Guesty successfully",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ----- CANCEL BOOKING -----
      case "cancel-booking": {
        const { externalBookingId, cancellationReason } = body;
        if (!externalBookingId) throw new Error("externalBookingId is required");

        const response = await callGuestyAPI(`/reservations/${externalBookingId}`, "PUT", {
          status: "canceled",
          note: cancellationReason ? `Cancelled: ${cancellationReason}` : "Cancelled via direct booking system",
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Failed to cancel reservation in Guesty: ${errText}`);
        }
        await response.text();

        return new Response(
          JSON.stringify({ success: true, message: "Booking cancelled in Guesty" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("guesty-sync error:", message);
    return new Response(JSON.stringify({ error: message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
