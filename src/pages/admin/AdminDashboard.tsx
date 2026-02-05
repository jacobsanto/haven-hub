import { motion } from 'framer-motion';
import { Building2, Calendar, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Timer, LogIn, LogOut, Sparkles, RefreshCw, AlertTriangle, CheckCircle2, CreditCard, Mail, BarChart3, Settings, Star, FileText, Package, Tag, Receipt, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminProperties } from '@/hooks/useProperties';
import { useBookingStats, useAdminBookings } from '@/hooks/useBookings';
import { useCheckoutHoldsStats, useTodayActivity, useRevenueStats, useOccupancyMetrics } from '@/hooks/useAdminAnalytics';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { useStripeHealth } from '@/hooks/useStripeHealth';
import { useNewsletterSubscribers } from '@/hooks/useNewsletterSubscribers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, subMonths, subDays, isAfter } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

const quickActions = [
  { label: 'Properties', icon: Building2, href: '/admin/properties', color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Bookings', icon: Calendar, href: '/admin/bookings', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { label: 'Promotions', icon: Tag, href: '/admin/promotions', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { label: 'Experiences', icon: Star, href: '/admin/experiences', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { label: 'Blog', icon: FileText, href: '/admin/blog', color: 'text-green-600', bgColor: 'bg-green-100' },
  { label: 'Analytics', icon: TrendingUp, href: '/admin/analytics', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { label: 'Add-ons', icon: Package, href: '/admin/addons', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { label: 'Settings', icon: Settings, href: '/admin/settings', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { label: 'Newsletter', icon: Mail, href: '/admin/newsletter', color: 'text-violet-600', bgColor: 'bg-violet-100' },
  { label: 'Fees', icon: Receipt, href: '/admin/fees', color: 'text-teal-600', bgColor: 'bg-teal-100' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    format: formatCurrency,
    formatCompact
  } = useFormatCurrency();
  const {
    data: properties
  } = useAdminProperties();
  const {
    data: stats
  } = useBookingStats();
  const {
    data: recentBookings
  } = useAdminBookings();
  const {
    data: holdsStats
  } = useCheckoutHoldsStats();
  const {
    data: todayActivity
  } = useTodayActivity();
  // Stripe payment health
  const stripeHealth = useStripeHealth();
  
  // Newsletter subscribers
  const { data: subscribers } = useNewsletterSubscribers();
  
  // Occupancy metrics for current month
  const { data: occupancyMetrics } = useOccupancyMetrics();

  // Revenue comparison: this month vs last month
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
  const {
    data: thisMonthRevenue
  } = useRevenueStats({
    start: thisMonthStart,
    end: thisMonthEnd
  });
  const {
    data: lastMonthRevenue
  } = useRevenueStats({
    start: lastMonthStart,
    end: lastMonthEnd
  });

  // Enable real-time updates
  useRealtimeBookings();

  // Newsletter stats
  const activeSubscribers = subscribers?.filter(s => s.is_active).length || 0;
  const recentSubscribers = subscribers?.filter(s => 
    isAfter(new Date(s.subscribed_at), subDays(new Date(), 7))
  ).length || 0;

  // Occupancy average
  const averageOccupancy = occupancyMetrics && occupancyMetrics.length > 0
    ? occupancyMetrics.reduce((sum, m) => sum + m.occupancyRate, 0) / occupancyMetrics.length
    : 0;

  // Calculate revenue trend
  const revenueTrend = thisMonthRevenue && lastMonthRevenue && lastMonthRevenue.totalRevenue > 0 ? (thisMonthRevenue.totalRevenue - lastMonthRevenue.totalRevenue) / lastMonthRevenue.totalRevenue * 100 : 0;
  const statCards = [{
    title: 'Total Properties',
    value: properties?.length || 0,
    icon: Building2,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  }, {
    title: 'Total Bookings',
    value: stats?.totalBookings || 0,
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  }, {
    title: 'Pending Bookings',
    value: stats?.pendingBookings || 0,
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  }, {
    title: 'Total Revenue',
    value: formatCurrency(stats?.totalRevenue || 0),
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  }];
  return <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="card-organic">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Quick Actions</p>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.href}
                      onClick={() => navigate(action.href)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className={`p-3 rounded-xl ${action.bgColor} group-hover:scale-110 transition-transform`}>
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-medium">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your properties.
            </p>
          </div>

          {/* Real-time Activity Strip */}
          <motion.div initial={{
          opacity: 0,
          y: -10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Active Checkout Holds */}
            <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Active Holds</span>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 animate-pulse">
                    Live
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-amber-800 mt-2">
                  {holdsStats?.activeHolds || 0}
                </p>
                <p className="text-xs text-amber-600 mt-1">Checkouts in progress</p>
              </CardContent>
            </Card>

            {/* Today's Check-ins */}
            <Card className="border-2 border-dashed border-green-300 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Check-ins Today</span>
                </div>
                <p className="text-2xl font-bold text-green-800 mt-2">
                  {todayActivity?.checkInsToday || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">Arrivals expected</p>
              </CardContent>
            </Card>

            {/* Today's Check-outs */}
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Check-outs Today</span>
                </div>
                <p className="text-2xl font-bold text-blue-800 mt-2">
                  {todayActivity?.checkOutsToday || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">Departures expected</p>
              </CardContent>
            </Card>

            {/* New Bookings Today */}
            <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">New Today</span>
                </div>
                <p className="text-2xl font-bold text-purple-800 mt-2">
                  {todayActivity?.newBookingsToday || 0}
                </p>
                <p className="text-xs text-purple-600 mt-1">Bookings received</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => <motion.div key={stat.title} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1
          }}>
                <Card className="card-organic">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-semibold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>

          {/* Revenue Trend Card */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }}>
            <Card className="card-organic bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month's Revenue</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(thisMonthRevenue?.totalRevenue || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {thisMonthRevenue?.confirmedBookings || 0} confirmed bookings
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 ${revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {revenueTrend >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      <span className="text-lg font-semibold">
                        {Math.abs(revenueTrend).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">vs last month</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Last: {formatCurrency(lastMonthRevenue?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
                {(thisMonthRevenue?.pendingRevenue || 0) > 0 && <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending revenue</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(thisMonthRevenue?.pendingRevenue || 0)}
                      </span>
                    </div>
                  </div>}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Health Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className={`card-organic border-2 ${
              stripeHealth.status === 'healthy' ? 'border-green-200 bg-green-50/30' : 
              stripeHealth.status === 'degraded' ? 'border-amber-200 bg-amber-50/30' : 
              stripeHealth.status === 'unhealthy' ? 'border-red-200 bg-red-50/30' :
              'border-muted'
            }`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {stripeHealth.status === 'healthy' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : stripeHealth.status === 'degraded' ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      ) : stripeHealth.status === 'unhealthy' ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">Payment System</p>
                      <p className="text-sm text-muted-foreground">
                        {stripeHealth.status === 'healthy' ? 'Stripe connected and processing payments normally' :
                         stripeHealth.status === 'degraded' ? 'Payment system partially available' :
                         stripeHealth.status === 'unhealthy' ? 'Payment system unavailable' :
                         stripeHealth.status === 'checking' ? 'Checking connection...' :
                         'Status unknown'}
                      </p>
                    </div>
                  </div>

                  <Button size="sm" onClick={() => stripeHealth.checkHealth(true)} disabled={stripeHealth.isChecking}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${stripeHealth.isChecking ? 'animate-spin' : ''}`} />
                    Check Now
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Stripe.js</p>
                    <p className={`text-sm font-medium ${stripeHealth.stripeLoaded ? 'text-green-600' : 'text-red-600'}`}>
                      {stripeHealth.stripeLoaded ? '✓ Loaded' : '✗ Failed'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Edge Function</p>
                    <p className={`text-sm font-medium ${stripeHealth.edgeFunctionReachable ? 'text-green-600' : 'text-red-600'}`}>
                      {stripeHealth.edgeFunctionReachable ? '✓ Reachable' : '✗ Unreachable'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Last Check</p>
                    <p className="text-sm font-medium">
                      {stripeHealth.lastChecked ? format(stripeHealth.lastChecked, 'HH:mm') : '—'}
                    </p>
                  </div>
                </div>

                {stripeHealth.error && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
                    <p className="text-xs font-medium">Issue detected</p>
                    <p className="text-sm text-muted-foreground mt-1">{stripeHealth.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Newsletter Growth Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <Card className="card-organic border-2 border-purple-200 bg-purple-50/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Newsletter Subscribers</p>
                    <p className="text-3xl font-bold text-purple-800 mt-2">{activeSubscribers}</p>
                    <p className="text-sm text-purple-600 mt-1">
                      {recentSubscribers > 0 ? `+${recentSubscribers} this week` : 'No new signups this week'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Occupancy Overview Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="card-organic">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">This Month's Occupancy</p>
                    <p className="text-sm text-muted-foreground">
                      Average: <span className={`font-medium ${
                        averageOccupancy >= 70 ? 'text-green-600' : 
                        averageOccupancy >= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>{averageOccupancy.toFixed(0)}%</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {occupancyMetrics?.slice(0, 4).map(metric => (
                    <div key={metric.propertyId} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium truncate">{metric.propertyName}</p>
                        <span className={`text-sm font-medium ${
                          metric.occupancyRate >= 70 ? 'text-green-600' : 
                          metric.occupancyRate >= 40 ? 'text-amber-600' : 'text-red-600'
                        }`}>{metric.occupancyRate.toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={metric.occupancyRate} 
                        className={`h-2 ${
                          metric.occupancyRate >= 70 ? '[&>div]:bg-green-500' : 
                          metric.occupancyRate >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {(!occupancyMetrics || occupancyMetrics.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No occupancy data available</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Bookings */}
          <Card className="card-organic">
            <CardHeader>
              <CardTitle className="font-serif">Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings && recentBookings.length > 0 ? <div className="space-y-4">
                  {recentBookings.slice(0, 5).map(booking => <div key={booking.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden">
                          {booking.property?.hero_image_url ? <img src={booking.property.hero_image_url} alt={booking.property.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>}
                        </div>
                        <div>
                          <p className="font-medium">{booking.guest_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.property?.name || 'Unknown Property'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(booking.total_price)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.check_in), 'MMM d')} -{' '}
                          {format(new Date(booking.check_out), 'MMM d')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {booking.status}
                      </span>
                    </div>)}
                </div> : <p className="text-muted-foreground text-center py-8">
                  No bookings yet
                </p>}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>;
}