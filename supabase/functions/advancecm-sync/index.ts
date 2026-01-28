import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TokeetRental {
  pkey: string;
  name: string;
  display_name?: string;
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
  };
  gps?: {
    lat?: number;
    long?: number;
  };
  tags?: string[];
  images?: Array<{ url: string }>;
}

interface SyncRequest {
  action:
    | "test"
    | "fetch-properties"
    | "fetch-property"
    | "fetch-availability"
    | "import-property";
  externalId?: string;
  startDate?: string;
  endDate?: string;
  propertyData?: TokeetRental;
  connectionId?: string;
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
        const rentals: TokeetRental[] = await response.json();

        // Transform to our format
        const properties = rentals.map((rental) => ({
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
          coordinates: rental.gps
            ? { lat: rental.gps.lat, lng: rental.gps.long }
            : null,
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

        const { data: newProperty, error: propertyError } = await supabase
          .from("properties")
          .insert({
            name: propertyData.name || propertyData.display_name,
            slug: slug + "-" + Date.now(), // Ensure unique slug
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
            base_price: 0, // Will be synced from rates
            status: "draft", // Start as draft for review
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
          // Rollback property creation
          await supabase.from("properties").delete().eq("id", newProperty.id);
          throw new Error(`Failed to create mapping: ${mappingError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            property: newProperty,
            message: `Imported ${propertyData.name} as draft`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
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
