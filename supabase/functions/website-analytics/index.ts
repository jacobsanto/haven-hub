import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'AU': 'Australia',
  'CA': 'Canada',
  'BR': 'Brazil',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'KR': 'South Korea',
  'MX': 'Mexico',
  'RU': 'Russia',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'PT': 'Portugal',
  'GR': 'Greece',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'SG': 'Singapore',
  'AE': 'United Arab Emirates',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Use anon key with user's auth for RLS check
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role key for analytics queries (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch page views within date range
    const { data: pageViews, error: pvError } = await supabaseAdmin
      .from('page_views')
      .select('*')
      .gte('created_at', `${startDate}T00:00:00.000Z`)
      .lte('created_at', `${endDate}T23:59:59.999Z`)
      .order('created_at', { ascending: true })

    if (pvError) {
      console.error('Error fetching page views:', pvError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analytics data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the data
    const analyticsData = processPageViews(pageViews || [], startDate, endDate)
    
    return new Response(
      JSON.stringify(analyticsData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Website analytics error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

interface PageView {
  id: string
  session_id: string
  path: string
  page_title: string | null
  referrer: string | null
  device_type: string | null
  browser: string | null
  country_code: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
}

function processPageViews(pageViews: PageView[], startDate: string, endDate: string) {
  const totalPageviews = pageViews.length
  
  // Get unique sessions
  const sessions = new Map<string, PageView[]>()
  pageViews.forEach(pv => {
    if (!sessions.has(pv.session_id)) {
      sessions.set(pv.session_id, [])
    }
    sessions.get(pv.session_id)!.push(pv)
  })
  
  const totalVisitors = sessions.size
  
  // Calculate bounce rate (sessions with only 1 page view)
  let bouncedSessions = 0
  sessions.forEach(views => {
    if (views.length === 1) bouncedSessions++
  })
  const bounceRate = totalVisitors > 0 ? ((bouncedSessions / totalVisitors) * 100).toFixed(1) : '0'
  
  // Calculate average session duration
  let totalDuration = 0
  let sessionsWithDuration = 0
  sessions.forEach(views => {
    if (views.length > 1) {
      const sortedViews = views.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const firstView = new Date(sortedViews[0].created_at).getTime()
      const lastView = new Date(sortedViews[sortedViews.length - 1].created_at).getTime()
      const duration = (lastView - firstView) / 1000 // in seconds
      if (duration > 0 && duration < 3600) { // Cap at 1 hour to avoid outliers
        totalDuration += duration
        sessionsWithDuration++
      }
    }
  })
  const avgSessionDuration = sessionsWithDuration > 0 
    ? Math.round(totalDuration / sessionsWithDuration) 
    : 0
  
  // Pages per visit
  const pageviewsPerVisit = totalVisitors > 0 
    ? (totalPageviews / totalVisitors).toFixed(2) 
    : '0'
  
  // Daily breakdown
  const dailyMap = new Map<string, { visitors: Set<string>, pageviews: number }>()
  
  // Initialize all days in range
  const start = new Date(startDate)
  const end = new Date(endDate)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    dailyMap.set(dateStr, { visitors: new Set(), pageviews: 0 })
  }
  
  // Fill in actual data
  pageViews.forEach(pv => {
    const dateStr = pv.created_at.split('T')[0]
    if (dailyMap.has(dateStr)) {
      const day = dailyMap.get(dateStr)!
      day.visitors.add(pv.session_id)
      day.pageviews++
    }
  })
  
  const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    visitors: data.visitors.size,
    pageviews: data.pageviews,
  }))
  
  // Traffic sources (from UTM or referrer)
  const sourceMap = new Map<string, Set<string>>()
  pageViews.forEach(pv => {
    let source = 'Direct'
    if (pv.utm_source) {
      source = pv.utm_source.charAt(0).toUpperCase() + pv.utm_source.slice(1)
    } else if (pv.referrer) {
      try {
        const url = new URL(pv.referrer)
        if (url.hostname.includes('google')) source = 'Organic Search'
        else if (url.hostname.includes('facebook') || url.hostname.includes('instagram') || url.hostname.includes('twitter') || url.hostname.includes('linkedin')) source = 'Social'
        else source = 'Referral'
      } catch {
        source = 'Referral'
      }
    }
    if (!sourceMap.has(source)) sourceMap.set(source, new Set())
    sourceMap.get(source)!.add(pv.session_id)
  })
  
  const sources = Array.from(sourceMap.entries())
    .map(([source, visitors]) => ({
      source,
      visitors: visitors.size,
      percentage: totalVisitors > 0 ? Math.round((visitors.size / totalVisitors) * 100) : 0,
    }))
    .sort((a, b) => b.visitors - a.visitors)
  
  // Top pages
  const pageMap = new Map<string, { path: string, title: string, views: number }>()
  pageViews.forEach(pv => {
    if (!pageMap.has(pv.path)) {
      pageMap.set(pv.path, { path: pv.path, title: pv.page_title || pv.path, views: 0 })
    }
    pageMap.get(pv.path)!.views++
  })
  
  const pages = Array.from(pageMap.values())
    .map(p => ({
      ...p,
      percentage: totalPageviews > 0 ? Math.round((p.views / totalPageviews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
  
  // Device breakdown
  const deviceMap = new Map<string, Set<string>>()
  pageViews.forEach(pv => {
    const device = pv.device_type || 'Unknown'
    if (!deviceMap.has(device)) deviceMap.set(device, new Set())
    deviceMap.get(device)!.add(pv.session_id)
  })
  
  const devices = Array.from(deviceMap.entries())
    .map(([device, visitors]) => ({
      device,
      visitors: visitors.size,
      percentage: totalVisitors > 0 ? Math.round((visitors.size / totalVisitors) * 100) : 0,
    }))
    .sort((a, b) => b.visitors - a.visitors)
  
  // Countries (if we have country data)
  const countryMap = new Map<string, Set<string>>()
  pageViews.forEach(pv => {
    if (pv.country_code) {
      if (!countryMap.has(pv.country_code)) countryMap.set(pv.country_code, new Set())
      countryMap.get(pv.country_code)!.add(pv.session_id)
    }
  })
  
  const countries = Array.from(countryMap.entries())
    .map(([code, visitors]) => ({
      country: COUNTRY_NAMES[code] || code,
      code,
      visitors: visitors.size,
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10)
  
  return {
    summary: {
      visitors: totalVisitors,
      pageviews: totalPageviews,
      pageviewsPerVisit,
      bounceRate,
      avgSessionDuration,
    },
    daily,
    sources,
    pages,
    devices,
    countries,
  }
}
