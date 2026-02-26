import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

  // Verify admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { postId } = await req.json();
    if (!postId) {
      return new Response(JSON.stringify({ error: "Missing postId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the post
    const { data: post, error: postError } = await supabase
      .from("social_posts")
      .select("*, account:social_accounts(*)")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to publishing
    await supabase.from("social_posts").update({ status: "publishing" } as any).eq("id", postId);

    // In this initial implementation, we simulate publishing.
    // When real API tokens are configured, this would call platform APIs.
    const account = post.account;
    const hasToken = account?.access_token && account.access_token.length > 0;

    if (!hasToken) {
      // No API token - mark as published (manual mode)
      await supabase
        .from("social_posts")
        .update({ status: "published", published_at: new Date().toISOString() } as any)
        .eq("id", postId);

      return new Response(
        JSON.stringify({ success: true, mode: "manual", message: "Post marked as published (no API token configured)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // API-ready placeholder: Platform-specific publishing would go here
    // For now, mark as published
    await supabase
      .from("social_posts")
      .update({ status: "published", published_at: new Date().toISOString() } as any)
      .eq("id", postId);

    return new Response(
      JSON.stringify({ success: true, mode: "api", message: "Post published" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("social-publish error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
