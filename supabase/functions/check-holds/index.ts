import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId, checkIn, checkOut, excludeSessionId } = await req.json();

    if (!propertyId || typeof propertyId !== "string") {
      return new Response(
        JSON.stringify({ error: true, message: "Missing propertyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase
      .from("checkout_holds")
      .select("id, property_id, check_in, check_out, session_id, expires_at")
      .eq("property_id", propertyId)
      .eq("released", false)
      .gt("expires_at", new Date().toISOString());

    if (checkIn && checkOut) {
      // Only return holds that overlap with the requested date range
      query = query
        .lt("check_in", checkOut)
        .gt("check_out", checkIn);
    }

    const { data: holds, error } = await query;

    if (error) {
      console.error("Error fetching holds:", error);
      return new Response(
        JSON.stringify({ error: true, message: "Failed to fetch holds" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out the requester's own session if provided
    const filteredHolds = excludeSessionId
      ? (holds || []).filter((h) => h.session_id !== excludeSessionId)
      : holds || [];

    // Return only non-sensitive fields
    const safeHolds = filteredHolds.map((h) => ({
      id: h.id,
      check_in: h.check_in,
      check_out: h.check_out,
      expires_at: h.expires_at,
    }));

    return new Response(
      JSON.stringify({ holds: safeHolds }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-holds error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
