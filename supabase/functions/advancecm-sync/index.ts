import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  minimum?: number;  // min stay
  maximum?: number;  // max stay
  start?: number;    // Unix timestamp
  end?: number;      // Unix timestamp
  from?: string;     // ISO date
  to?: string;       // ISO date
  currency?: string;
  type?: string;     // 'standard', 'seasonal', etc.
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
  // For create-booking
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
  // For cancel-booking
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
    const body: SyncRequest = await req.json();
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
