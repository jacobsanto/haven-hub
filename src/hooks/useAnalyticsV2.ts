import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns';

// ─── Shared helpers ──────────────────────────────────────────────

const last30Start = () => format(subDays(new Date(), 30), 'yyyy-MM-dd');
const todayStr = () => format(new Date(), 'yyyy-MM-dd');

// ─── TAB 1: Property Performance ─────────────────────────────────

export interface AnalyticsPropertyRow {
  propertyId: string;
  propertyName: string;
  occupancyPct: number;
  adr: number;         // Average Daily Rate
  revpar: number;      // Revenue Per Available Room-Night
  revenue: number;
  addonPct: number;
  cancellationPct: number;
  riskLevel: 'green' | 'amber' | 'red';
}

export function useAnalyticsPropertyPerformance() {
  const start = last30Start();
  const end = todayStr();

  return useQuery({
    queryKey: ['admin', 'analytics', 'property-perf-v2', start],
    queryFn: async (): Promise<AnalyticsPropertyRow[]> => {
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name')
        .eq('status', 'active');

      if (!properties || properties.length === 0) return [];

      const [bookingsRes, addonsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('property_id, total_price, nights, status')
          .gte('check_in', start)
          .lte('check_in', end),
        supabase
          .from('booking_addons')
          .select('booking_id, total_price, booking:bookings(property_id)')
          .gte('created_at', start),
      ]);

      const bookings = bookingsRes.data || [];
      const addons = addonsRes.data || [];

      // Addon revenue per property
      const addonByProp = new Map<string, number>();
      addons.forEach(a => {
        const propId = (a.booking as any)?.property_id;
        if (propId) {
          addonByProp.set(propId, (addonByProp.get(propId) || 0) + Number(a.total_price));
        }
      });

      const rows: AnalyticsPropertyRow[] = properties.map(prop => {
        const propBookings = bookings.filter(b => b.property_id === prop.id);
        const confirmed = propBookings.filter(b => b.status === 'confirmed');
        const cancelled = propBookings.filter(b => b.status === 'cancelled');
        const totalBookings = propBookings.length;

        const revenue = confirmed.reduce((s, b) => s + Number(b.total_price), 0);
        const bookedNights = confirmed.reduce((s, b) => s + b.nights, 0);
        const occupancyPct = (Math.min(bookedNights, 30) / 30) * 100;
        const adr = bookedNights > 0 ? revenue / bookedNights : 0;
        const revpar = adr * (occupancyPct / 100);
        const cancellationPct = totalBookings > 0 ? (cancelled.length / totalBookings) * 100 : 0;
        const addonRev = addonByProp.get(prop.id) || 0;
        const addonPct = revenue > 0 ? (addonRev / revenue) * 100 : 0;

        return {
          propertyId: prop.id,
          propertyName: prop.name,
          occupancyPct: Math.round(occupancyPct * 10) / 10,
          adr: Math.round(adr * 100) / 100,
          revpar: Math.round(revpar * 100) / 100,
          revenue,
          addonPct: Math.round(addonPct * 10) / 10,
          cancellationPct: Math.round(cancellationPct * 10) / 10,
          riskLevel: 'green' as const,
        };
      });

      const avgOcc = rows.length > 0 ? rows.reduce((s, r) => s + r.occupancyPct, 0) / rows.length : 0;

      rows.forEach(r => {
        if (r.occupancyPct < avgOcc - 15 || r.cancellationPct > 12) {
          r.riskLevel = 'red';
        } else if (r.addonPct < 5) {
          r.riskLevel = 'amber';
        }
      });

      return rows.sort((a, b) => a.occupancyPct - b.occupancyPct);
    },
  });
}

// ─── TAB 2: Revenue Intelligence ─────────────────────────────────

export interface RevenueIntelligence {
  revenueThisMonth: number;
  changePercent: number;
  averageBookingValue: number;
  addonContributionPct: number;
  cancellationLossPct: number;
  pendingRevenue: number;
  alerts: { key: string; label: string }[];
}

export function useRevenueIntelligence() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'revenue-intel-v2'],
    queryFn: async (): Promise<RevenueIntelligence> => {
      const thisStart = startOfMonth(new Date());
      const thisEnd = endOfMonth(new Date());
      const lastStart = startOfMonth(subMonths(new Date(), 1));
      const lastEnd = endOfMonth(subMonths(new Date(), 1));

      const [thisMonthRes, lastMonthRes, addonRes, cancelledRes, unpaidRes] = await Promise.all([
        supabase.from('bookings').select('total_price, status').gte('check_in', format(thisStart, 'yyyy-MM-dd')).lte('check_in', format(thisEnd, 'yyyy-MM-dd')),
        supabase.from('bookings').select('total_price, status').gte('check_in', format(lastStart, 'yyyy-MM-dd')).lte('check_in', format(lastEnd, 'yyyy-MM-dd')),
        supabase.from('booking_addons').select('total_price').gte('created_at', format(thisStart, 'yyyy-MM-dd')),
        supabase.from('bookings').select('total_price').eq('status', 'cancelled').gte('check_in', format(thisStart, 'yyyy-MM-dd')).lte('check_in', format(thisEnd, 'yyyy-MM-dd')),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('payment_status', 'unpaid').eq('status', 'pending'),
      ]);

      const thisConfirmed = thisMonthRes.data?.filter(b => b.status === 'confirmed') || [];
      const lastConfirmed = lastMonthRes.data?.filter(b => b.status === 'confirmed') || [];
      const thisPending = thisMonthRes.data?.filter(b => b.status === 'pending') || [];

      const revenueThisMonth = thisConfirmed.reduce((s, b) => s + Number(b.total_price), 0);
      const revenueLastMonth = lastConfirmed.reduce((s, b) => s + Number(b.total_price), 0);
      const pendingRevenue = thisPending.reduce((s, b) => s + Number(b.total_price), 0);
      const avgBooking = thisConfirmed.length > 0 ? revenueThisMonth / thisConfirmed.length : 0;
      const addonRevenue = addonRes.data?.reduce((s, a) => s + Number(a.total_price), 0) || 0;
      const addonPct = revenueThisMonth > 0 ? (addonRevenue / revenueThisMonth) * 100 : 0;
      const changePercent = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

      const cancelledRevenue = cancelledRes.data?.reduce((s, b) => s + Number(b.total_price), 0) || 0;
      const cancellationLossPct = (revenueThisMonth + cancelledRevenue) > 0
        ? (cancelledRevenue / (revenueThisMonth + cancelledRevenue)) * 100 : 0;

      // Build alerts
      const alerts: { key: string; label: string }[] = [];
      if (addonPct < 3) alerts.push({ key: 'low-addon', label: 'Add-on contribution below 3%' });
      if (cancellationLossPct > 10) alerts.push({ key: 'cancel-spike', label: `Cancellation loss at ${cancellationLossPct.toFixed(1)}%` });
      if ((unpaidRes.count || 0) > 3) alerts.push({ key: 'unpaid-high', label: `${unpaidRes.count} unpaid bookings pending` });

      return {
        revenueThisMonth,
        changePercent,
        averageBookingValue: avgBooking,
        addonContributionPct: Math.round(addonPct * 10) / 10,
        cancellationLossPct: Math.round(cancellationLossPct * 10) / 10,
        pendingRevenue,
        alerts,
      };
    },
  });
}

// ─── TAB 3: Marketing & Campaigns ────────────────────────────────

export interface CampaignRow {
  id: string;
  title: string;
  type: string;
  conversionPct: number;
  revenueGenerated: number;
  status: string;
  impressions: number;
  flagLowConversion: boolean;
}

export function useCampaignPerformance() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'campaign-perf-v2'],
    queryFn: async (): Promise<CampaignRow[]> => {
      const { data: campaigns, error } = await supabase
        .from('promotional_campaigns')
        .select('id, title, discount_method, is_active, starts_at, ends_at, impressions_count, coupon_id, auto_discount_percent')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!campaigns) return [];

      // Get coupon usage for conversion approximation
      const couponIds = campaigns.map(c => c.coupon_id).filter(Boolean) as string[];
      let couponUsage = new Map<string, { uses: number }>();
      if (couponIds.length > 0) {
        const { data: coupons } = await supabase
          .from('coupons_promos')
          .select('id, uses_count')
          .in('id', couponIds);
        coupons?.forEach(c => couponUsage.set(c.id, { uses: c.uses_count }));
      }

      return campaigns.map(c => {
        const impressions = c.impressions_count || 0;
        const usage = c.coupon_id ? couponUsage.get(c.coupon_id) : null;
        const conversions = usage?.uses || 0;
        const conversionPct = impressions > 0 ? (conversions / impressions) * 100 : 0;

        const now = new Date();
        const isActive = c.is_active && new Date(c.starts_at) <= now && new Date(c.ends_at) >= now;
        const isExpired = new Date(c.ends_at) < now;

        return {
          id: c.id,
          title: c.title,
          type: c.discount_method === 'coupon' ? 'Coupon' : 'Auto-discount',
          conversionPct: Math.round(conversionPct * 10) / 10,
          revenueGenerated: 0, // Would need booking-level attribution
          status: isActive ? 'Active' : isExpired ? 'Expired' : 'Scheduled',
          impressions,
          flagLowConversion: impressions > 50 && conversionPct < 2,
        };
      });
    },
  });
}

// ─── TAB 4: Pricing Strategy ─────────────────────────────────────

export type PricingSignal = 'lower-price' | 'raise-price' | 'marketing-issue' | 'healthy';

export interface PricingStrategyRow {
  propertyId: string;
  propertyName: string;
  adr: number;
  occupancyPct: number;
  adrVsAvg: number;  // percentage diff
  occVsAvg: number;  // percentage diff
  signal: PricingSignal;
}

export function usePricingStrategy() {
  const start = last30Start();
  const end = todayStr();

  return useQuery({
    queryKey: ['admin', 'analytics', 'pricing-strategy-v2', start],
    queryFn: async (): Promise<PricingStrategyRow[]> => {
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name')
        .eq('status', 'active');

      if (!properties || properties.length === 0) return [];

      const { data: bookings } = await supabase
        .from('bookings')
        .select('property_id, total_price, nights, status')
        .eq('status', 'confirmed')
        .gte('check_in', start)
        .lte('check_in', end);

      const rows = properties.map(prop => {
        const propBookings = (bookings || []).filter(b => b.property_id === prop.id);
        const revenue = propBookings.reduce((s, b) => s + Number(b.total_price), 0);
        const bookedNights = propBookings.reduce((s, b) => s + b.nights, 0);
        const adr = bookedNights > 0 ? revenue / bookedNights : 0;
        const occupancyPct = (Math.min(bookedNights, 30) / 30) * 100;

        return {
          propertyId: prop.id,
          propertyName: prop.name,
          adr: Math.round(adr * 100) / 100,
          occupancyPct: Math.round(occupancyPct * 10) / 10,
          adrVsAvg: 0,
          occVsAvg: 0,
          signal: 'healthy' as PricingSignal,
        };
      });

      const avgAdr = rows.length > 0 ? rows.reduce((s, r) => s + r.adr, 0) / rows.length : 0;
      const avgOcc = rows.length > 0 ? rows.reduce((s, r) => s + r.occupancyPct, 0) / rows.length : 0;

      rows.forEach(r => {
        r.adrVsAvg = avgAdr > 0 ? ((r.adr - avgAdr) / avgAdr) * 100 : 0;
        r.occVsAvg = avgOcc > 0 ? ((r.occupancyPct - avgOcc) / avgOcc) * 100 : 0;

        const lowOcc = r.occupancyPct < avgOcc - 10;
        const highOcc = r.occupancyPct > avgOcc + 10;
        const lowAdr = r.adr < avgAdr * 0.85;
        const highAdr = r.adr > avgAdr * 1.15;

        if (lowOcc && highAdr) r.signal = 'lower-price';
        else if (highOcc && lowAdr) r.signal = 'raise-price';
        else if (lowOcc && lowAdr) r.signal = 'marketing-issue';
        else r.signal = 'healthy';
      });

      return rows.sort((a, b) => a.occupancyPct - b.occupancyPct);
    },
  });
}
