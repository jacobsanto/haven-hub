import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CSVRow {
  property_slug: string;
  season_name: string;
  start_date: string;
  end_date: string;
  nightly_rate?: string;
  price_multiplier?: string;
}

interface ImportResult {
  row: number;
  property_slug: string;
  season_name: string;
  success: boolean;
  error?: string;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const requiredHeaders = ['property_slug', 'season_name', 'start_date', 'end_date'];
  
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV parsing with potential quoted values
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.replace(/^["']|["']$/g, '') || '';
    });

    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

function validateDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

Deno.serve(async (req) => {
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

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, csvContent } = await req.json();

    if (action === "validate") {
      // Parse and validate CSV without importing
      const rows = parseCSV(csvContent);
      
      // Get all properties for validation
      const { data: properties } = await supabase
        .from("properties")
        .select("slug, name, id");

      const propertyMap = new Map(properties?.map(p => [p.slug, p]) || []);
      
      const validationResults = rows.map((row, index) => {
        const errors: string[] = [];
        
        if (!row.property_slug) {
          errors.push("Missing property_slug");
        } else if (!propertyMap.has(row.property_slug)) {
          errors.push(`Property not found: ${row.property_slug}`);
        }
        
        if (!row.season_name) {
          errors.push("Missing season_name");
        }
        
        if (!row.start_date || !validateDate(row.start_date)) {
          errors.push("Invalid start_date (use YYYY-MM-DD)");
        }
        
        if (!row.end_date || !validateDate(row.end_date)) {
          errors.push("Invalid end_date (use YYYY-MM-DD)");
        }
        
        if (row.start_date && row.end_date && new Date(row.start_date) >= new Date(row.end_date)) {
          errors.push("start_date must be before end_date");
        }
        
        const hasNightly = row.nightly_rate && row.nightly_rate.trim() !== '';
        const hasMultiplier = row.price_multiplier && row.price_multiplier.trim() !== '';
        
        if (!hasNightly && !hasMultiplier) {
          errors.push("Must provide either nightly_rate or price_multiplier");
        }
        
        if (hasNightly && isNaN(parseFloat(row.nightly_rate!))) {
          errors.push("Invalid nightly_rate (must be a number)");
        }
        
        if (hasMultiplier && isNaN(parseFloat(row.price_multiplier!))) {
          errors.push("Invalid price_multiplier (must be a number)");
        }

        return {
          row: index + 2, // +2 for 1-indexed and header row
          property_slug: row.property_slug,
          property_name: propertyMap.get(row.property_slug)?.name || null,
          season_name: row.season_name,
          start_date: row.start_date,
          end_date: row.end_date,
          nightly_rate: hasNightly ? parseFloat(row.nightly_rate!) : null,
          price_multiplier: hasMultiplier ? parseFloat(row.price_multiplier!) : null,
          valid: errors.length === 0,
          errors,
        };
      });

      return new Response(
        JSON.stringify({
          success: true,
          totalRows: validationResults.length,
          validRows: validationResults.filter(r => r.valid).length,
          invalidRows: validationResults.filter(r => !r.valid).length,
          results: validationResults,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "import") {
      const rows = parseCSV(csvContent);
      
      // Get all properties
      const { data: properties } = await supabase
        .from("properties")
        .select("slug, id");

      const propertyMap = new Map(properties?.map(p => [p.slug, p.id]) || []);
      
      const results: ImportResult[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        try {
          const propertyId = propertyMap.get(row.property_slug);
          if (!propertyId) {
            throw new Error(`Property not found: ${row.property_slug}`);
          }

          if (!validateDate(row.start_date) || !validateDate(row.end_date)) {
            throw new Error("Invalid date format");
          }

          const hasNightly = row.nightly_rate && row.nightly_rate.trim() !== '';
          const hasMultiplier = row.price_multiplier && row.price_multiplier.trim() !== '';

          const insertData = {
            property_id: propertyId,
            name: row.season_name,
            start_date: row.start_date,
            end_date: row.end_date,
            nightly_rate: hasNightly ? parseFloat(row.nightly_rate!) : null,
            price_multiplier: hasMultiplier ? parseFloat(row.price_multiplier!) : 1.0,
          };

          const { error } = await supabase
            .from("seasonal_rates")
            .insert(insertData);

          if (error) {
            throw new Error(error.message);
          }

          results.push({
            row: rowNum,
            property_slug: row.property_slug,
            season_name: row.season_name,
            success: true,
          });
          successCount++;
        } catch (err) {
          results.push({
            row: rowNum,
            property_slug: row.property_slug,
            season_name: row.season_name,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
          failedCount++;
        }
      }

      return new Response(
        JSON.stringify({
          success: failedCount === 0,
          totalRows: rows.length,
          successCount,
          failedCount,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
