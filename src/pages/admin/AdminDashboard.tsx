import { motion } from 'framer-motion';
import { Building2, Calendar, TrendingUp, Clock, Users, ArrowUpRight, ArrowDownRight, Timer, LogIn, LogOut, Sparkles, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminProperties } from '@/hooks/useProperties';
import { useBookingStats, useAdminBookings } from '@/hooks/useBookings';
import { useCheckoutHoldsStats, useTodayActivity, useRevenueStats } from '@/hooks/useAdminAnalytics';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { usePMSSyncStatus, useTriggerPMSSync } from '@/hooks/usePMSSyncStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

export default function AdminDashboard() {
  const { format: formatCurrency, formatCompact } = useFormatCurrency();
  const { data: properties } = useAdminProperties();
  const { data: stats } = useBookingStats();
  const { data: recentBookings } = useAdminBookings();
  const { data: holdsStats } = useCheckoutHoldsStats();
  const { data: todayActivity } = useTodayActivity();
  const { data: pmsSyncStatus } = usePMSSyncStatus();
  const triggerSync = useTriggerPMSSync();
  
  // Revenue comparison: this month vs last month
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
  
  const { data: thisMonthRevenue } = useRevenueStats({ start: thisMonthStart, end: thisMonthEnd });
  const { data: lastMonthRevenue } = useRevenueStats({ start: lastMonthStart, end: lastMonthEnd });
  
  // Enable real-time updates
  useRealtimeBookings();

  const handleTriggerSync = async () => {
    try {
      await triggerSync.mutateAsync();
      toast({
        title: 'Sync started',
        description: 'PMS availability sync has been triggered.',
      });
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to trigger sync',
        variant: 'destructive',
      });
    }
  };

  // Use centralized EUR formatter for admin display

  // Calculate revenue trend
  const revenueTrend = thisMonthRevenue && lastMonthRevenue && lastMonthRevenue.totalRevenue > 0
    ? ((thisMonthRevenue.totalRevenue - lastMonthRevenue.totalRevenue) / lastMonthRevenue.totalRevenue) * 100
    : 0;

  const statCards = [
    {
      title: 'Total Properties',
      value: properties?.length || 0,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Bookings',
      value: stats?.pendingBookings || 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-medium">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your properties.
            </p>
          </div>

          {/* Real-time Activity Strip */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
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
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
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
              </motion.div>
            ))}
          </div>

          {/* Revenue Trend Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
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
                      {revenueTrend >= 0 ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
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
                {(thisMonthRevenue?.pendingRevenue || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending revenue</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(thisMonthRevenue?.pendingRevenue || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* PMS Sync Status Card */}
          {pmsSyncStatus?.connection && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className={`card-organic border-2 ${
                pmsSyncStatus.isHealthy 
                  ? 'border-green-200 bg-green-50/30' 
                  : pmsSyncStatus.errorCount > 0 
                    ? 'border-red-200 bg-red-50/30' 
                    : 'border-amber-200 bg-amber-50/30'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {pmsSyncStatus.isHealthy ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : pmsSyncStatus.errorCount > 0 ? (
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      ) : (
                        <Clock className="h-6 w-6 text-amber-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {pmsSyncStatus.connection.pms_name} Sync
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pmsSyncStatus.isHealthy 
                            ? 'All properties synced successfully' 
                            : pmsSyncStatus.errorCount > 0 
                              ? `${pmsSyncStatus.errorCount} sync errors in last 10 runs`
                              : 'Waiting for first sync'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {pmsSyncStatus.lastRun && (
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Last sync</p>
                          <p className="font-medium">
                            {format(new Date(pmsSyncStatus.lastRun.started_at), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTriggerSync}
                        disabled={triggerSync.isPending}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${triggerSync.isPending ? 'animate-spin' : ''}`} />
                        {triggerSync.isPending ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    </div>
                  </div>
                  
                  {pmsSyncStatus.lastRun && (
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status: </span>
                        <Badge 
                          variant={pmsSyncStatus.lastRun.status === 'success' ? 'default' : 'destructive'}
                          className={pmsSyncStatus.lastRun.status === 'success' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {pmsSyncStatus.lastRun.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processed: </span>
                        <span className="font-medium">{pmsSyncStatus.lastRun.records_processed || 0}</span>
                      </div>
                      {(pmsSyncStatus.lastRun.records_failed || 0) > 0 && (
                        <div>
                          <span className="text-muted-foreground">Failed: </span>
                          <span className="font-medium text-red-600">{pmsSyncStatus.lastRun.records_failed}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recent Bookings */}
          <Card className="card-organic">
            <CardHeader>
              <CardTitle className="font-serif">Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings && recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden">
                          {booking.property?.hero_image_url ? (
                            <img
                              src={booking.property.hero_image_url}
                              alt={booking.property.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
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
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No bookings yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
