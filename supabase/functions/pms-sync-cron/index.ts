// Scheduled PMS Sync Edge Function
// Called by pg_cron every 5 minutes to sync availability from iCal feeds
// Uses iCal feeds for accurate blocked date sync (replacing buggy Availability API)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PMSPropertyMapping {
  property_id: string;
  external_property_id: string;
  pms_connection_id: string;
  ical_url: string | null;
}

interface PMSConnection {
  id: string;
  pms_name: string;
  config: {
    provider?: string;
    auto_sync_enabled?: boolean;
    sync_interval_minutes?: number;
  } | null;
}

interface ICalEvent {
  dtstart: string;
  dtend: string;
  summary: string;
  uid: string;
}

// Parse iCal date format (YYYYMMDD) to ISO date string (YYYY-MM-DD)
function parseICalDate(dateStr: string): string {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}

// Parse iCal feed and extract all VEVENT blocks
function parseICalFeed(icalText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  
  // Match VEVENT blocks
  const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
  const eventBlocks = icalText.match(eventRegex) || [];
  
  for (const block of eventBlocks) {
    // Extract DTSTART (check-in date)
    const startMatch = block.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);
    // Extract DTEND (checkout date - day guest leaves)
    const endMatch = block.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/);
    // Extract SUMMARY (guest name or block description)
    const summaryMatch = block.match(/SUMMARY:(.+?)(?:\r?\n|$)/);
    // Extract UID
    const uidMatch = block.match(/UID:(.+?)(?:\r?\n|$)/);
    
    if (startMatch && endMatch) {
      events.push({
        dtstart: parseICalDate(startMatch[1]),
        dtend: parseICalDate(endMatch[1]),
        summary: summaryMatch ? summaryMatch[1].trim() : "Blocked",
        uid: uidMatch ? uidMatch[1].trim() : `event-${startMatch[1]}-${endMatch[1]}`,
      });
    }
  }
  
  return events;
}

// Convert iCal events to blocked date set
// DTSTART = check-in (block this day)
// DTEND = checkout (DON'T block - guest leaves, next guest can check in)
function eventsToBlockedDates(events: ICalEvent[]): Set<string> {
  const blockedDates = new Set<string>();
  
  for (const event of events) {
    const startDate = new Date(event.dtstart);
    const endDate = new Date(event.dtend);
    
    // Block from DTSTART to DTEND-1 (checkout day is available for new check-in)
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      blockedDates.add(d.toISOString().split("T")[0]);
    }
  }
  
  return blockedDates;
}

// Fetch and parse iCal feed for a property
async function fetchICalFeed(icalUrl: string): Promise<{ success: boolean; events?: ICalEvent[]; error?: string }> {
  try {
    const response = await fetch(icalUrl, {
      headers: {
        "Accept": "text/calendar",
      },
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const icalText = await response.text();
    
    // Validate it's actually an iCal feed
    if (!icalText.includes("BEGIN:VCALENDAR")) {
      return { success: false, error: "Invalid iCal format - missing VCALENDAR" };
    }
    
    const events = parseICalFeed(icalText);
    return { success: true, events };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch iCal feed" 
    };
  }
}

// Sync availability for a property using iCal feed
async function syncPropertyFromICal(
  supabaseUrl: string,
  serviceRoleKey: string,
  propertyId: string,
  icalUrl: string
): Promise<{ success: boolean; blockedDays: number; events: number; error?: string }> {
  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Fetch and parse iCal feed
    const feedResult = await fetchICalFeed(icalUrl);
    
    if (!feedResult.success || !feedResult.events) {
      return { 
        success: false, 
        blockedDays: 0, 
        events: 0, 
        error: feedResult.error 
      };
    }
    
    const events = feedResult.events;
    console.log(`Property ${propertyId}: Parsed ${events.length} events from iCal feed`);
    
    // Log first few events for debugging
    events.slice(0, 3).forEach(e => {
      console.log(`  Event: ${e.summary} | ${e.dtstart} - ${e.dtend}`);
    });
    
    // Convert events to blocked dates
    const blockedDates = eventsToBlockedDates(events);
    console.log(`Property ${propertyId}: ${blockedDates.size} blocked dates from iCal`);
    
    // Calculate date range for sync (today to 12 months out)
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 12);
    const endDate = futureDate.toISOString().split("T")[0];
    
    // Filter blocked dates to only include those within our sync window
    const blockedInWindow = new Set<string>();
    for (const dateStr of blockedDates) {
      if (dateStr >= today && dateStr <= endDate) {
        blockedInWindow.add(dateStr);
      }
    }
    
    // Prepare blocked date records for UPSERT
    const availabilityRecords: Array<{ property_id: string; date: string; available: boolean }> = [];
    for (const dateStr of blockedInWindow) {
      availabilityRecords.push({
        property_id: propertyId,
        date: dateStr,
        available: false,
      });
    }
    
    // Upsert blocked dates
    if (availabilityRecords.length > 0) {
      // Batch upsert in chunks to avoid query limits
      const BATCH_SIZE = 200;
      for (let i = 0; i < availabilityRecords.length; i += BATCH_SIZE) {
        const batch = availabilityRecords.slice(i, i + BATCH_SIZE);
        const { error: upsertError } = await adminClient
          .from("availability")
          .upsert(batch, {
            onConflict: "property_id,date",
            ignoreDuplicates: false,
          });
        
        if (upsertError) {
          console.error(`Property ${propertyId}: Upsert error batch ${i / BATCH_SIZE + 1}: ${upsertError.message}`);
        }
      }
    }
    
    // Get existing blocked dates for this property within sync window
    const { data: existingBlocked, error: fetchError } = await adminClient
      .from("availability")
      .select("date")
      .eq("property_id", propertyId)
      .eq("available", false)
      .gte("date", today)
      .lte("date", endDate);
    
    if (fetchError) {
      console.warn(`Property ${propertyId}: Could not fetch existing blocked dates: ${fetchError.message}`);
    } else if (existingBlocked) {
      // Find dates that were blocked but are now available (removed from iCal)
      const datesToUnblock = existingBlocked
        .map((r) => r.date.split("T")[0])
        .filter((d) => !blockedInWindow.has(d));
      
      console.log(`Property ${propertyId}: ${datesToUnblock.length} stale dates to unblock`);
      
      // Batch delete stale blocks
      if (datesToUnblock.length > 0) {
        const BATCH_SIZE = 100;
        for (let i = 0; i < datesToUnblock.length; i += BATCH_SIZE) {
          const batch = datesToUnblock.slice(i, i + BATCH_SIZE);
          const { error: deleteError } = await adminClient
            .from("availability")
            .delete()
            .eq("property_id", propertyId)
            .in("date", batch);
          
          if (deleteError) {
            console.warn(`Property ${propertyId}: Could not unblock dates batch: ${deleteError.message}`);
          }
        }
      }
    }
    
    // Update last sync timestamps
    await adminClient
      .from("pms_property_map")
      .update({ 
        last_availability_sync_at: new Date().toISOString(),
        last_ical_sync_at: new Date().toISOString(),
      })
      .eq("property_id", propertyId);
    
    return { 
      success: true, 
      blockedDays: blockedInWindow.size, 
      events: events.length 
    };
  } catch (error) {
    return {
      success: false,
      blockedDays: 0,
      events: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client (service role for cron jobs)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse request body
    let action = "sync-all-availability";
    let triggerType: "scheduled" | "manual" = "scheduled";
    let targetPropertyId: string | undefined;
    
    try {
      const body = await req.json();
      action = body.action || action;
      triggerType = body.triggerType || triggerType;
      targetPropertyId = body.propertyId;
    } catch {
      // Empty body is fine for scheduled calls
    }

    if (action === "sync-all-availability" || action === "sync-property") {
      // Get active connection
      const { data: connection, error: connError } = await adminClient
        .from("pms_connections")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (connError || !connection) {
        console.log("No active PMS connection found");
        return new Response(
          JSON.stringify({ success: false, message: "No active PMS connection" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const config = connection.config as PMSConnection["config"];
      
      // Check if auto-sync is enabled (skip for manual triggers)
      if (triggerType === "scheduled" && config?.auto_sync_enabled === false) {
        console.log("Auto-sync is disabled");
        return new Response(
          JSON.stringify({ success: true, message: "Auto-sync disabled", skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build query for property mappings
      let mappingsQuery = adminClient
        .from("pms_property_map")
        .select("property_id, external_property_id, pms_connection_id, ical_url")
        .eq("pms_connection_id", connection.id)
        .eq("sync_enabled", true);
      
      // Filter to single property if specified
      if (targetPropertyId) {
        mappingsQuery = mappingsQuery.eq("property_id", targetPropertyId);
      }

      const { data: mappings, error: mappingsError } = await mappingsQuery;

      if (mappingsError) {
        throw new Error(`Failed to fetch mappings: ${mappingsError.message}`);
      }

      if (!mappings || mappings.length === 0) {
        console.log("No property mappings found");
        return new Response(
          JSON.stringify({ success: true, message: "No properties to sync", total: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter to only properties with iCal URLs
      const mappingsWithICal = (mappings as PMSPropertyMapping[]).filter(m => m.ical_url);
      const mappingsWithoutICal = mappings.length - mappingsWithICal.length;
      
      if (mappingsWithICal.length === 0) {
        console.log("No properties have iCal URLs configured");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "No iCal URLs configured", 
            total: mappings.length,
            skipped: mappings.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (mappingsWithoutICal > 0) {
        console.log(`${mappingsWithoutICal} properties skipped (no iCal URL)`);
      }

      // Create sync run record
      const { data: syncRun, error: syncRunError } = await adminClient
        .from("pms_sync_runs")
        .insert({
          pms_connection_id: connection.id,
          sync_type: "ical_availability",
          status: "running",
          trigger_type: triggerType,
        })
        .select()
        .single();

      if (syncRunError) {
        console.error("Failed to create sync run:", syncRunError);
      }

      // Sync each property
      let synced = 0;
      let failed = 0;
      let totalEvents = 0;
      let totalBlockedDays = 0;
      const errors: string[] = [];

      for (const mapping of mappingsWithICal) {
        const result = await syncPropertyFromICal(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          mapping.property_id,
          mapping.ical_url!
        );

        if (result.success) {
          synced++;
          totalEvents += result.events;
          totalBlockedDays += result.blockedDays;
        } else {
          failed++;
          if (result.error) {
            errors.push(`Property ${mapping.external_property_id}: ${result.error}`);
          }
        }
      }

      // Update sync run
      if (syncRun) {
        const summaryParts: string[] = [];
        if (totalEvents > 0) {
          summaryParts.push(`${totalEvents} events, ${totalBlockedDays} blocked days`);
        }
        if (errors.length > 0) {
          summaryParts.push(errors.slice(0, 3).join("; "));
        }
        if (mappingsWithoutICal > 0) {
          summaryParts.push(`${mappingsWithoutICal} skipped (no iCal)`);
        }

        await adminClient
          .from("pms_sync_runs")
          .update({
            status: failed === 0 ? "success" : synced > 0 ? "partial" : "failed",
            completed_at: new Date().toISOString(),
            records_processed: synced,
            records_failed: failed,
            error_summary: summaryParts.length > 0 ? summaryParts.join(" | ") : null,
          })
          .eq("id", syncRun.id);
      }

      // Update connection last sync
      await adminClient
        .from("pms_connections")
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: failed === 0 ? "success" : synced > 0 ? "partial" : "error",
        })
        .eq("id", connection.id);

      console.log(`iCal sync complete: ${synced} properties synced, ${failed} failed, ${totalEvents} events, ${totalBlockedDays} blocked days`);

      return new Response(
        JSON.stringify({
          success: failed === 0,
          total: mappings.length,
          synced,
          failed,
          skipped: mappingsWithoutICal,
          events: totalEvents,
          blockedDays: totalBlockedDays,
          errors: errors.slice(0, 5),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test iCal URL action
    if (action === "test-ical") {
      let icalUrl: string | undefined;
      try {
        const body = await req.json();
        icalUrl = body.icalUrl;
      } catch {
        // Already parsed above
      }

      if (!icalUrl) {
        return new Response(
          JSON.stringify({ success: false, error: "icalUrl is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await fetchICalFeed(icalUrl);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({ success: false, error: result.error }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const blockedDates = eventsToBlockedDates(result.events || []);
      
      return new Response(
        JSON.stringify({
          success: true,
          events: result.events?.length || 0,
          blockedDays: blockedDates.size,
          sampleEvents: result.events?.slice(0, 5).map(e => ({
            summary: e.summary,
            checkIn: e.dtstart,
            checkOut: e.dtend,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync cron error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
