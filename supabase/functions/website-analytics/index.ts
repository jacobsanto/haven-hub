import { Hono } from 'https://deno.land/x/hono@v4.0.0/mod.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const app = new Hono()

// Handle CORS preflight
app.options('*', (c) => {
  return c.json({}, { headers: corsHeaders })
})

app.post('/', async (c) => {
  try {
    // Verify user is authenticated and is an admin
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      return c.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const userId = claimsData.claims.sub
    
    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      return c.json({ error: 'Forbidden: Admin access required' }, { status: 403, headers: corsHeaders })
    }

    const body = await c.req.json()
    const { startDate, endDate, granularity = 'daily' } = body

    if (!startDate || !endDate) {
      return c.json({ error: 'startDate and endDate are required' }, { status: 400, headers: corsHeaders })
    }

    // For now, return mock analytics data since the actual Lovable Cloud analytics API
    // would need to be called from internal infrastructure.
    // This provides a realistic data structure that matches the expected format.
    
    const mockData = generateMockAnalytics(startDate, endDate, granularity)
    
    return c.json(mockData, { headers: corsHeaders })
  } catch (error) {
    console.error('Website analytics error:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
})

function generateMockAnalytics(startDate: string, endDate: string, granularity: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  // Generate daily breakdown
  const dailyData = []
  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    
    // Simulate realistic traffic patterns
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const baseVisitors = isWeekend ? 150 : 200
    const variance = Math.random() * 100 - 50
    
    dailyData.push({
      date: date.toISOString().split('T')[0],
      visitors: Math.round(baseVisitors + variance),
      pageviews: Math.round((baseVisitors + variance) * (2.5 + Math.random())),
    })
  }
  
  // Calculate totals
  const totalVisitors = dailyData.reduce((sum, d) => sum + d.visitors, 0)
  const totalPageviews = dailyData.reduce((sum, d) => sum + d.pageviews, 0)
  
  return {
    summary: {
      visitors: totalVisitors,
      pageviews: totalPageviews,
      pageviewsPerVisit: totalVisitors > 0 ? (totalPageviews / totalVisitors).toFixed(2) : '0',
      bounceRate: (35 + Math.random() * 15).toFixed(1),
      avgSessionDuration: Math.round(120 + Math.random() * 180), // seconds
    },
    daily: dailyData,
    sources: [
      { source: 'Direct', visitors: Math.round(totalVisitors * 0.35), percentage: 35 },
      { source: 'Organic Search', visitors: Math.round(totalVisitors * 0.30), percentage: 30 },
      { source: 'Social', visitors: Math.round(totalVisitors * 0.15), percentage: 15 },
      { source: 'Referral', visitors: Math.round(totalVisitors * 0.12), percentage: 12 },
      { source: 'Email', visitors: Math.round(totalVisitors * 0.08), percentage: 8 },
    ],
    pages: [
      { path: '/', title: 'Home', views: Math.round(totalPageviews * 0.25), percentage: 25 },
      { path: '/properties', title: 'Properties', views: Math.round(totalPageviews * 0.20), percentage: 20 },
      { path: '/destinations', title: 'Destinations', views: Math.round(totalPageviews * 0.15), percentage: 15 },
      { path: '/blog', title: 'Blog', views: Math.round(totalPageviews * 0.12), percentage: 12 },
      { path: '/experiences', title: 'Experiences', views: Math.round(totalPageviews * 0.10), percentage: 10 },
      { path: '/about', title: 'About', views: Math.round(totalPageviews * 0.08), percentage: 8 },
      { path: '/contact', title: 'Contact', views: Math.round(totalPageviews * 0.05), percentage: 5 },
      { path: '/checkout', title: 'Checkout', views: Math.round(totalPageviews * 0.05), percentage: 5 },
    ],
    devices: [
      { device: 'Desktop', visitors: Math.round(totalVisitors * 0.55), percentage: 55 },
      { device: 'Mobile', visitors: Math.round(totalVisitors * 0.38), percentage: 38 },
      { device: 'Tablet', visitors: Math.round(totalVisitors * 0.07), percentage: 7 },
    ],
    countries: [
      { country: 'United States', code: 'US', visitors: Math.round(totalVisitors * 0.25) },
      { country: 'United Kingdom', code: 'GB', visitors: Math.round(totalVisitors * 0.15) },
      { country: 'Germany', code: 'DE', visitors: Math.round(totalVisitors * 0.12) },
      { country: 'France', code: 'FR', visitors: Math.round(totalVisitors * 0.10) },
      { country: 'Italy', code: 'IT', visitors: Math.round(totalVisitors * 0.08) },
      { country: 'Spain', code: 'ES', visitors: Math.round(totalVisitors * 0.06) },
      { country: 'Netherlands', code: 'NL', visitors: Math.round(totalVisitors * 0.05) },
      { country: 'Australia', code: 'AU', visitors: Math.round(totalVisitors * 0.04) },
    ],
  }
}

Deno.serve(app.fetch)
