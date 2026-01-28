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
    | "fetch-rates"
    | "sync-rates"
    | "import-property";
  externalId?: string;
  startDate?: string;
  endDate?: string;
  propertyData?: TokeetRental;
  connectionId?: string;
  propertyId?: string;
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

      case "fetch-rates": {
        const { externalId } = body;
        if (!externalId) {
          throw new Error("externalId is required");
        }

        const response = await callTokeetAPI(
          `/rental/${externalId}/rate`,
          apiKey,
          accountId
        );

        if (!response.ok) {
          throw new Error(`Tokeet API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract rates array from response
        let rates: TokeetRate[] = [];
        if (Array.isArray(data)) {
          rates = data;
        } else if (data?.data && Array.isArray(data.data)) {
          rates = data.data;
        } else if (data?.rates && Array.isArray(data.rates)) {
          rates = data.rates;
        }

        // Transform to our format
        const transformedRates = (rates || []).map((rate: TokeetRate) => ({
          externalId: rate.pkey || rate.key,
          rentalId: rate.rental_id,
          name: rate.name || "Standard Rate",
          nightly: rate.nightly || 0,
          weekly: rate.weekly,
          monthly: rate.monthly,
          minStay: rate.minimum || 1,
          maxStay: rate.maximum,
          validFrom: rate.start ? new Date(rate.start * 1000).toISOString().split('T')[0] : rate.from,
          validTo: rate.end ? new Date(rate.end * 1000).toISOString().split('T')[0] : rate.to,
          currency: rate.currency || "EUR",
          type: rate.type || "standard",
        }));

        return new Response(
          JSON.stringify({ success: true, rates: transformedRates }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "sync-rates": {
        const { externalId, propertyId } = body;
        if (!externalId || !propertyId) {
          throw new Error("externalId and propertyId are required");
        }

        // Fetch rates from Tokeet
        const response = await callTokeetAPI(
          `/rental/${externalId}/rate`,
          apiKey,
          accountId
        );

        let rates: TokeetRate[] = [];
        let basePrice = 0;

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            rates = data;
          } else if (data?.data && Array.isArray(data.data)) {
            rates = data.data;
          } else if (data?.rates && Array.isArray(data.rates)) {
            rates = data.rates;
          }
        }

        // Also try to get baserate from the rental itself
        const rentalResponse = await callTokeetAPI(
          `/rental/${externalId}`,
          apiKey,
          accountId
        );

        if (rentalResponse.ok) {
          const rental = await rentalResponse.json();
          if (rental?.baserate?.nightly) {
            basePrice = rental.baserate.nightly;
          }
        }

        // Find base rate from rates if not found in rental
        if (basePrice === 0 && rates.length > 0) {
          // Look for a rate without date restrictions (the default rate)
          const defaultRate = rates.find((r: TokeetRate) => !r.start && !r.end && !r.from && !r.to);
          if (defaultRate?.nightly) {
            basePrice = defaultRate.nightly;
          } else if (rates[0]?.nightly) {
            basePrice = rates[0].nightly;
          }
        }

        // Update property base_price
        if (basePrice > 0) {
          await supabase
            .from("properties")
            .update({ base_price: basePrice })
            .eq("id", propertyId);
        }

        // Create seasonal rates for date-specific pricing
        let seasonalRatesCreated = 0;
        let ratePlansCreated = 0;

        for (const rate of rates) {
          const hasDateRange = rate.start || rate.end || rate.from || rate.to;
          
          if (hasDateRange && rate.nightly) {
            const startDate = rate.start 
              ? new Date(rate.start * 1000).toISOString().split('T')[0]
              : rate.from;
            const endDate = rate.end
              ? new Date(rate.end * 1000).toISOString().split('T')[0]
              : rate.to;

            if (startDate && endDate) {
              const { error } = await supabase.from("seasonal_rates").insert({
                property_id: propertyId,
                name: rate.name || "Seasonal Rate",
                start_date: startDate,
                end_date: endDate,
                nightly_rate: rate.nightly,
                price_multiplier: 1.0,
              });

              if (!error) seasonalRatesCreated++;
            }
          }

          // Create rate plan if it has min/max stay requirements
          if (rate.minimum && rate.minimum > 1) {
            const validFrom = rate.start
              ? new Date(rate.start * 1000).toISOString().split('T')[0]
              : rate.from || new Date().toISOString().split('T')[0];
            const validUntil = rate.end
              ? new Date(rate.end * 1000).toISOString().split('T')[0]
              : rate.to || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const { error } = await supabase.from("rate_plans").insert({
              property_id: propertyId,
              name: rate.name || "Standard Rate",
              base_rate: rate.nightly || basePrice,
              min_stay: rate.minimum || 1,
              max_stay: rate.maximum,
              valid_from: validFrom,
              valid_until: validUntil,
              rate_type: rate.type || "standard",
              is_active: true,
            });

            if (!error) ratePlansCreated++;
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            basePrice,
            seasonalRatesCreated,
            ratePlansCreated,
            message: `Synced rates: base €${basePrice}, ${seasonalRatesCreated} seasonal, ${ratePlansCreated} rate plans`,
          }),
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

        // Try to get base price from the rental data
        let basePrice = propertyData.baserate?.nightly || 0;

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
            base_price: basePrice,
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

        // Fetch and sync rates for the imported property
        const ratesResponse = await callTokeetAPI(
          `/rental/${propertyData.pkey}/rate`,
          apiKey,
          accountId
        );

        let ratesSynced = false;
        if (ratesResponse.ok) {
          const ratesData = await ratesResponse.json();
          let rates: TokeetRate[] = [];
          
          if (Array.isArray(ratesData)) {
            rates = ratesData;
          } else if (ratesData?.data && Array.isArray(ratesData.data)) {
            rates = ratesData.data;
          }

          // Update base_price if we found rates
          if (rates.length > 0 && basePrice === 0) {
            const defaultRate = rates.find((r: TokeetRate) => !r.start && !r.end) || rates[0];
            if (defaultRate?.nightly) {
              await supabase
                .from("properties")
                .update({ base_price: defaultRate.nightly })
                .eq("id", newProperty.id);
              basePrice = defaultRate.nightly;
            }
          }

          // Create seasonal rates
          for (const rate of rates) {
            if ((rate.start || rate.from) && (rate.end || rate.to) && rate.nightly) {
              const startDate = rate.start
                ? new Date(rate.start * 1000).toISOString().split('T')[0]
                : rate.from;
              const endDate = rate.end
                ? new Date(rate.end * 1000).toISOString().split('T')[0]
                : rate.to;

              if (startDate && endDate) {
                await supabase.from("seasonal_rates").insert({
                  property_id: newProperty.id,
                  name: rate.name || "Seasonal Rate",
                  start_date: startDate,
                  end_date: endDate,
                  nightly_rate: rate.nightly,
                  price_multiplier: 1.0,
                });
              }
            }
          }
          ratesSynced = true;
        }

        return new Response(
          JSON.stringify({
            success: true,
            property: { ...newProperty, base_price: basePrice },
            ratesSynced,
            message: `Imported ${propertyData.name} as draft${ratesSynced ? ' with rates' : ''}`,
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
