import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledPost {
  id: string;
  topic: string;
  category_id: string | null;
  author_id: string | null;
  generation_settings: Record<string, unknown>;
  auto_publish: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending posts that are due
    const { data: pendingPosts, error: fetchError } = await supabase
      .from("scheduled_blog_posts")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(5); // Process max 5 at a time to avoid timeouts

    if (fetchError) {
      console.error("Error fetching pending posts:", fetchError);
      throw fetchError;
    }

    if (!pendingPosts || pendingPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending posts to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingPosts.length} scheduled posts`);
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const post of pendingPosts as ScheduledPost[]) {
      try {
        // Mark as generating
        await supabase
          .from("scheduled_blog_posts")
          .update({ status: "generating", updated_at: new Date().toISOString() })
          .eq("id", post.id);

        // Call generate-content function
        const settings = post.generation_settings || {};
        const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            contentType: "blog",
            targetName: post.topic,
            tone: settings.tone || "luxury",
            length: settings.length || "medium",
            template: settings.template || "destination_guide",
            persona: settings.persona,
            marketingAngle: settings.marketingAngle,
            travelStyle: settings.travelStyle,
            customInstructions: settings.customInstructions,
          }),
        });

        if (!generateResponse.ok) {
          const errorText = await generateResponse.text();
          throw new Error(`Generation failed: ${errorText}`);
        }

        const generateResult = await generateResponse.json();
        
        if (!generateResult.success) {
          throw new Error(generateResult.error || "Content generation failed");
        }

        const content = generateResult.content;

        // Generate slug from title
        const slug = content.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          + "-" + Date.now().toString(36);

        // Create blog post
        const blogPostData = {
          title: content.title,
          slug,
          excerpt: content.excerpt,
          content: content.content,
          tags: content.tags || [],
          category_id: post.category_id,
          author_id: post.author_id,
          status: post.auto_publish ? "published" : "draft",
          published_at: post.auto_publish ? new Date().toISOString() : null,
          is_featured: false,
        };

        const { data: newPost, error: insertError } = await supabase
          .from("blog_posts")
          .insert(blogPostData)
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to create blog post: ${insertError.message}`);
        }

        // Update scheduled post status
        await supabase
          .from("scheduled_blog_posts")
          .update({
            status: post.auto_publish ? "published" : "review",
            generated_post_id: newPost.id,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        results.push({ id: post.id, success: true });
        console.log(`Successfully processed post ${post.id}: ${content.title}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing post ${post.id}:`, errorMessage);

        // Mark as failed
        await supabase
          .from("scheduled_blog_posts")
          .update({
            status: "failed",
            error_message: errorMessage,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        results.push({ id: post.id, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Processed ${pendingPosts.length} posts: ${successCount} succeeded, ${failCount} failed`,
        processed: pendingPosts.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Cron job error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
