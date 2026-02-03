import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Zod validation schemas for each action
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
  externalId: z.string().min(1).max(100),
});

const fetchAvailabilitySchema = baseRequestSchema.extend({
  action: z.literal("fetch-availability"),
  externalId: z.string().min(1).max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const importPropertySchema = baseRequestSchema.extend({
  action: z.literal("import-property"),
  propertyData: z.object({
    pkey: z.string(),
    name: z.string().optional(),
    display_name: z.string().optional(),
  }).passthrough(),
  connectionId: z.string().uuid(),
});

const createBookingSchema = baseRequestSchema.extend({
  action: z.literal("create-booking"),
  externalPropertyId: z.string().min(1).max(100),
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
  externalBookingId: z.string().min(1).max(100),
  cancellationReason: z.string().max(500).optional(),
});

function validateSyncRequest(body: unknown): { success: true; data: SyncRequest } | { success: false; error: string } {
  const baseResult = baseRequestSchema.safeParse(body);
  if (!baseResult.success) {
    return { success: false, error: "Invalid action" };
  }

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
    return { success: false, error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') };
  }

  return { success: true, data: body as SyncRequest };
}

interface TokeetRental {
  pkey: string;
  name?: string;
  display_name?: string;
  nickname?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sleep_min?: number;
  sleep_max?: number;
  type?: string;
  address?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    CC?: string;
    country_code?: string;
  };
  gps?: {
    lat?: number;
    long?: number;
  };
  tags?: string[];
  images?: Array<{ url: string }>;
  baserate?: {
    nightly?: number;
    weekly?: number;
    monthly?: number;
    minimum?: number;
    maximum?: number;
  };
  rates?: TokeetRate[];
}

interface TokeetRate {
  pkey?: string;
  key?: string;
  rental_id?: string;
  name?: string;
  nightly?: number;
  weekly?: number;
  monthly?: number;
  minimum?: number;
  maximum?: number;
  start?: number;
  end?: number;
  from?: string;
  to?: string;
  currency?: string;
  type?: string;
}

interface SyncRequest {
  action:
    | "test"
    | "fetch-properties"
    | "fetch-property"
    | "fetch-availability"
    | "sync-availability"
    | "import-property"
    | "create-booking"
    | "cancel-booking";
  externalId?: string;
  startDate?: string;
  endDate?: string;
  propertyData?: TokeetRental;
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

// Country code to full name mapping
const countryCodeMap: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  GR: "Greece",
  IT: "Italy",
  FR: "France",
  ES: "Spain",
  PT: "Portugal",
  DE: "Germany",
  NL: "Netherlands",
  MV: "Maldives",
  ID: "Indonesia",
  TH: "Thailand",
  MX: "Mexico",
  CR: "Costa Rica",
  AU: "Australia",
};

// Property type mapping
const propertyTypeMap: Record<string, string> = {
  villa: "villa",
  house: "villa",
  apartment: "apartment",
  condo: "apartment",
  cottage: "cottage",
  penthouse: "penthouse",
  estate: "estate",
  default: "villa",
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapCountryCode(code?: string): string {
  if (!code) return "Unknown";
  return countryCodeMap[code.toUpperCase()] || code;
}

function mapPropertyType(type?: string): string {
  if (!type) return "villa";
  const lowerType = type.toLowerCase();
  return propertyTypeMap[lowerType] || propertyTypeMap.default;
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
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

  // Verify the user is authenticated
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify admin role - this is an admin-only edge function
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    return new Response(
      JSON.stringify({ error: "Forbidden: Admin access required" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Get Tokeet credentials
  const apiKey = Deno.env.get("TOKEET_API_KEY");
  const accountId = Deno.env.get("TOKEET_ACCOUNT_ID");

  if (!apiKey || !accountId) {
    return new Response(
      JSON.stringify({
        error: "Tokeet credentials not configured",
        missingCredentials: true,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const rawBody = await req.json();
    
    // Validate request using action-specific schema
    const validationResult = validateSyncRequest(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validationResult.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const body: SyncRequest = validationResult.data;
    const { action } = body;

    switch (action) {
      case "test": {
        // Test connection by fetching rentals list
        const response = await callTokeetAPI("/rental", apiKey, accountId);
        const success = response.ok;
        return new Response(
          JSON.stringify({
            success,
            message: success
              ? "Connection successful"
              : "Connection failed: " + response.statusText,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "fetch-properties": {
        const response = await callTokeetAPI("/rental", apiKey, accountId);
        if (!response.ok) {
          throw new Error(`Tokeet API error: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Tokeet API returns {"data": [...]} format - extract rentals array
        let rentals: TokeetRental[] = [];
        
        if (data && typeof data === 'object') {
          if (data.error) {
            throw new Error(`Tokeet API error: ${data.error}`);
          }
          
          // Try different possible array locations
          if (Array.isArray(data)) {
            rentals = data;
          } else if (Array.isArray(data.data)) {
            rentals = data.data;
          } else if (Array.isArray(data.rentals)) {
            rentals = data.rentals;
          } else if (Array.isArray(data.results)) {
            rentals = data.results;
          }
        } else if (Array.isArray(data)) {
          rentals = data;
        }

        // Transform to our format - ensure rentals is always an array
        // Include baserate for rate syncing
        const properties = (rentals || []).map((rental: TokeetRental) => ({
          externalId: rental.pkey,
          name: rental.name || rental.display_name || rental.nickname || "Unnamed Property",
          description: rental.description || null,
          bedrooms: rental.bedrooms || 1,
          bathrooms: rental.bathrooms || 1,
          maxGuests: rental.sleep_max || 2,
          city: rental.address?.city || "Unknown",
          region: rental.address?.state || null,
          country: mapCountryCode(rental.address?.CC || rental.address?.country_code),
          propertyType: mapPropertyType(rental.type),
          highlights: rental.tags || [],
          images: rental.images?.map((img: { url: string }) => img.url) || [],
          coordinates: rental.gps
            ? { lat: rental.gps.lat, lng: rental.gps.long }
            : null,
          // Include baserate data for rate syncing
          baserate: rental.baserate ? {
            nightly: rental.baserate.nightly || 0,
            weekly: rental.baserate.weekly,
            monthly: rental.baserate.monthly,
            minStay: rental.baserate.minimum || 1,
            maxStay: rental.baserate.maximum,
          } : null,
        }));

        return new Response(
          JSON.stringify({ success: true, properties }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "fetch-property": {
        const { externalId } = body;
        if (!externalId) {
          throw new Error("externalId is required");
        }
        const response = await callTokeetAPI(
          `/rental/${externalId}`,
          apiKey,
          accountId
        );
        if (!response.ok) {
          throw new Error(`Tokeet API error: ${response.statusText}`);
        }
        const rental: TokeetRental = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            property: {
              externalId: rental.pkey,
              name: rental.name || rental.display_name || "Unnamed Property",
              description: rental.description || null,
              bedrooms: rental.bedrooms || 1,
              bathrooms: rental.bathrooms || 1,
              maxGuests: rental.sleep_max || 2,
              city: rental.address?.city || "Unknown",
              region: rental.address?.state || null,
              country: mapCountryCode(rental.address?.CC),
              propertyType: mapPropertyType(rental.type),
              highlights: rental.tags || [],
              images: rental.images?.map((img) => img.url) || [],
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "fetch-availability": {
        const { externalId, startDate, endDate } = body;
        if (!externalId) {
          throw new Error("externalId is required");
        }

        const endpoint = startDate && endDate
          ? `/rental/${externalId}/availability?from=${startDate}&to=${endDate}`
          : `/rental/${externalId}/availability`;

        const response = await callTokeetAPI(endpoint, apiKey, accountId);
        if (!response.ok) {
          throw new Error(`Tokeet API error: ${response.statusText}`);
        }
        const availability = await response.json();

        return new Response(
          JSON.stringify({ success: true, availability }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "import-property": {
        const { propertyData, connectionId } = body;
        if (!propertyData || !connectionId) {
          throw new Error("propertyData and connectionId are required");
        }

        // Create property in database
        const slug = generateSlug(
          propertyData.name || propertyData.display_name || "property"
        );

        // Import with base_price = 0 - admin sets pricing manually
        const { data: newProperty, error: propertyError } = await supabase
          .from("properties")
          .insert({
            name: propertyData.name || propertyData.display_name,
            slug: slug + "-" + Date.now(),
            description: propertyData.description || null,
            city: propertyData.address?.city || "Unknown",
            region: propertyData.address?.state || null,
            country: mapCountryCode(propertyData.address?.CC),
            bedrooms: propertyData.bedrooms || 1,
            bathrooms: propertyData.bathrooms || 1,
            max_guests: propertyData.sleep_max || 2,
            property_type: mapPropertyType(propertyData.type),
            highlights: propertyData.tags || [],
            gallery: propertyData.images?.map((img) => img.url) || [],
            base_price: 0, // Admin sets pricing via Rate Plans / Seasonal Rates
            status: "draft",
          })
          .select()
          .single();

        if (propertyError) {
          throw new Error(`Failed to create property: ${propertyError.message}`);
        }

        // Create mapping in pms_property_map
        const { error: mappingError } = await supabase
          .from("pms_property_map")
          .insert({
            pms_connection_id: connectionId,
            property_id: newProperty.id,
            external_property_id: propertyData.pkey,
            external_property_name: propertyData.name || propertyData.display_name,
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
            message: `Imported ${propertyData.name} as draft. Set up pricing in Rate Plans section.`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "create-booking": {
        const { externalPropertyId, bookingReference, checkIn, checkOut, guests, adults, children, guestInfo, totalPrice, currency, priceBreakdownNotes } = body;
        
        if (!externalPropertyId || !checkIn || !checkOut || !guestInfo) {
          throw new Error("Missing required booking fields");
        }

        // Create guest in Tokeet
        const guestPayload = {
          name: `${guestInfo.firstName} ${guestInfo.lastName}`,
          email: guestInfo.email,
          phone: guestInfo.phone || "",
          country: guestInfo.country || "",
        };

        await fetch(`https://capi.tokeet.com/v1/guest?account=${accountId}`, {
          method: "POST",
          headers: { Authorization: apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(guestPayload),
        });

        // Create booking/inquiry in Tokeet
        const bookingPayload = {
          rental_id: externalPropertyId,
          check_in: checkIn,
          check_out: checkOut,
          num_guests: guests || (adults || 1) + (children || 0),
          num_adults: adults || 1,
          num_child: children || 0,
          price: totalPrice || 0,
          currency: currency || "EUR",
          source: "Direct Website",
          status: "booked",
          confirmation_code: bookingReference,
          guest: guestPayload,
          notes: priceBreakdownNotes || "",
        };

        const bookingResponse = await fetch(`https://capi.tokeet.com/v1/inquiry?account=${accountId}`, {
          method: "POST",
          headers: { Authorization: apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(bookingPayload),
        });

        if (!bookingResponse.ok) {
          const errorText = await bookingResponse.text();
          throw new Error(`Failed to create booking in PMS: ${errorText}`);
        }

        const bookingData = await bookingResponse.json();

        return new Response(
          JSON.stringify({
            success: true,
            externalBookingId: bookingData.pkey || bookingData.id,
            message: "Booking pushed to PMS successfully",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel-booking": {
        const { externalBookingId, cancellationReason } = body;
        
        if (!externalBookingId) {
          throw new Error("externalBookingId is required");
        }

        const cancelResponse = await fetch(
          `https://capi.tokeet.com/v1/inquiry/${externalBookingId}?account=${accountId}`,
          {
            method: "PUT",
            headers: { Authorization: apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "cancelled",
              notes: cancellationReason ? `Cancelled: ${cancellationReason}` : "Cancelled via direct booking system",
            }),
          }
        );

        if (!cancelResponse.ok) {
          throw new Error(`Failed to cancel booking in PMS`);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Booking cancelled in PMS" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync-availability": {
        const { propertyId, startDate, endDate } = body;
        if (!propertyId) {
          throw new Error("propertyId is required");
        }

        // Create admin client for database operations
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Look up the external property ID from the mapping
        const { data: mapping, error: mappingError } = await adminClient
          .from("pms_property_map")
          .select("external_property_id")
          .eq("property_id", propertyId)
          .maybeSingle();

        if (mappingError || !mapping) {
          throw new Error("Property not mapped to PMS");
        }

        const externalPropertyId = mapping.external_property_id;

        // Calculate date range - default to 12 months
        const start = startDate || new Date().toISOString().split("T")[0];
        const endDateObj = endDate ? new Date(endDate) : new Date();
        if (!endDate) {
          endDateObj.setMonth(endDateObj.getMonth() + 12);
        }
        const end = endDateObj.toISOString().split("T")[0];

        // Fetch availability from Tokeet
        const endpoint = `/rental/${externalPropertyId}/availability?from=${start}&to=${end}`;
        const response = await callTokeetAPI(endpoint, apiKey, accountId);
        if (!response.ok) {
          throw new Error(`Tokeet API error: ${response.statusText}`);
        }
        
        const tokeetAvailability = await response.json();

        // Process the Tokeet availability response
        // Tokeet returns blocked date ranges - dates in these ranges are unavailable
        // Format can be: { blocked: [{ from: "YYYY-MM-DD", to: "YYYY-MM-DD" }] } or array of blocked periods
        let blockedRanges: Array<{ from: string; to: string }> = [];
        
        if (Array.isArray(tokeetAvailability)) {
          blockedRanges = tokeetAvailability.map((range: { from?: string; to?: string; start?: string; end?: string }) => ({
            from: range.from || range.start || "",
            to: range.to || range.end || "",
          })).filter((r: { from: string; to: string }) => r.from && r.to);
        } else if (tokeetAvailability?.blocked && Array.isArray(tokeetAvailability.blocked)) {
          blockedRanges = tokeetAvailability.blocked;
        } else if (tokeetAvailability?.data && Array.isArray(tokeetAvailability.data)) {
          blockedRanges = tokeetAvailability.data.map((range: { from?: string; to?: string; start?: string; end?: string }) => ({
            from: range.from || range.start || "",
            to: range.to || range.end || "",
          })).filter((r: { from: string; to: string }) => r.from && r.to);
        }

        // Generate all dates in range and mark blocked ones
        const startDt = new Date(start);
        const endDt = new Date(end);
        const blockedDates = new Set<string>();

        // Build set of all blocked dates
        for (const range of blockedRanges) {
          const rangeStart = new Date(range.from);
          const rangeEnd = new Date(range.to);
          for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
            blockedDates.add(d.toISOString().split("T")[0]);
          }
        }

        // Prepare upsert data - only blocked dates need to be stored
        const availabilityRecords: Array<{ property_id: string; date: string; available: boolean }> = [];
        for (let d = new Date(startDt); d <= endDt; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          const isBlocked = blockedDates.has(dateStr);
          // Only upsert blocked dates to keep table size manageable
          // Dates not in table are assumed available
          if (isBlocked) {
            availabilityRecords.push({
              property_id: propertyId,
              date: dateStr,
              available: false,
            });
          }
        }

        // Clear existing availability records for this property and date range
        await adminClient
          .from("availability")
          .delete()
          .eq("property_id", propertyId)
          .gte("date", start)
          .lte("date", end);

        // Insert new blocked dates
        if (availabilityRecords.length > 0) {
          const { error: upsertError } = await adminClient
            .from("availability")
            .insert(availabilityRecords);

          if (upsertError) {
            throw new Error(`Failed to upsert availability: ${upsertError.message}`);
          }
        }

        // Update last sync timestamp on the mapping
        await adminClient
          .from("pms_property_map")
          .update({ last_availability_sync_at: new Date().toISOString() })
          .eq("property_id", propertyId);

        return new Response(
          JSON.stringify({
            success: true,
            daysProcessed: Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)),
            blockedDaysFound: blockedDates.size,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
