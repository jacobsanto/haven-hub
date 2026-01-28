import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths, subDays, startOfYear } from 'date-fns';
import { 
  DollarSign, 
  CalendarCheck, 
  TrendingUp, 
  Moon,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Package,
  Users
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { 
  useRevenueStats, 
  useMonthlyTrends, 
  useRevenueByProperty, 
  useOccupancyMetrics,
  useAddonPerformance,
  useTodayActivity
} from '@/hooks/useAdminAnalytics';

type DateRangePreset = 'this_month' | 'last_30_days' | 'last_3_months' | 'year_to_date' | 'last_12_months';

const getDateRange = (preset: DateRangePreset): { start: Date; end: Date } => {
  const now = new Date();
  switch (preset) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_30_days':
      return { start: subDays(now, 30), end: now };
    case 'last_3_months':
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    case 'year_to_date':
      return { start: startOfYear(now), end: now };
    case 'last_12_months':
      return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
};

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  bookings: {
    label: "Bookings",
    color: "hsl(142 76% 36%)",
  },
  occupancy: {
    label: "Occupancy",
    color: "hsl(217 91% 60%)",
  },
} satisfies ChartConfig;

const getOccupancyColor = (rate: number) => {
  if (rate >= 70) return 'hsl(142 76% 36%)'; // Green
  if (rate >= 40) return 'hsl(48 96% 53%)'; // Yellow
  return 'hsl(0 84% 60%)'; // Red
};

export default function AdminAnalytics() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last_3_months');
  const dateRange = getDateRange(datePreset);

  // Data hooks
  const { data: revenueStats, isLoading: statsLoading } = useRevenueStats(dateRange);
  const { data: monthlyTrends, isLoading: trendsLoading } = useMonthlyTrends(12);
  const { data: propertyRevenue, isLoading: propertyLoading } = useRevenueByProperty(dateRange);
  const { data: occupancyMetrics, isLoading: occupancyLoading } = useOccupancyMetrics(dateRange);
  const { data: addonPerformance, isLoading: addonsLoading } = useAddonPerformance(dateRange);
  const { data: todayActivity, isLoading: activityLoading } = useTodayActivity();

  const statsCards = [
    {
      title: 'Total Revenue',
      value: revenueStats ? formatCurrency(revenueStats.totalRevenue) : '€0',
      icon: DollarSign,
      description: 'Confirmed bookings',
      trend: revenueStats && revenueStats.totalRevenue > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Confirmed Bookings',
      value: revenueStats?.confirmedBookings ?? 0,
      icon: CalendarCheck,
      description: 'In selected period',
      trend: revenueStats && revenueStats.confirmedBookings > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Avg Booking Value',
      value: revenueStats ? formatCurrency(revenueStats.averageBookingValue) : '€0',
      icon: TrendingUp,
      description: 'Per booking',
      trend: 'neutral',
    },
    {
      title: 'Avg Stay Length',
      value: revenueStats ? `${revenueStats.averageStayLength.toFixed(1)} nights` : '0 nights',
      icon: Moon,
      description: 'Per booking',
      trend: 'neutral',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
            <p className="text-muted-foreground">
              Track revenue, bookings, and property performance
            </p>
          </div>
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DateRangePreset)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="year_to_date">Year to Date</SelectItem>
              <SelectItem value="last_12_months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          {statsCards.map((stat, index) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {stat.value}
                      {stat.trend === 'up' && (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      )}
                      {stat.trend === 'down' && (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Monthly Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trends</CardTitle>
              <CardDescription>Revenue and booking count over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : monthlyTrends && monthlyTrends.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value, name) => {
                          if (name === 'revenue') return [formatCurrency(value as number), 'Revenue'];
                          return [value, 'Bookings'];
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--color-revenue)" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="bookings" 
                        stroke="var(--color-bookings)" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Bookings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No booking data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Two Column Charts */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Revenue by Property */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Revenue by Property</CardTitle>
                <CardDescription>Top performing properties by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {propertyLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : propertyRevenue && propertyRevenue.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={propertyRevenue.slice(0, 5)} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis 
                          type="number"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis 
                          dataKey="propertyName" 
                          type="category"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={100}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="var(--color-revenue)" 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No property revenue data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Occupancy Rates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Occupancy Rates</CardTitle>
                <CardDescription>Property occupancy for selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {occupancyLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : occupancyMetrics && occupancyMetrics.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={occupancyMetrics.slice(0, 5)} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis 
                          type="number"
                          domain={[0, 100]}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          dataKey="propertyName" 
                          type="category"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={100}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Occupancy']}
                        />
                        <Bar 
                          dataKey="occupancyRate" 
                          radius={[0, 4, 4, 0]}
                        >
                          {occupancyMetrics.slice(0, 5).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getOccupancyColor(entry.occupancyRate)} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No occupancy data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Today's Activity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Today's Activity
                </CardTitle>
                <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : todayActivity ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <ArrowUpRight className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Check-ins Today</p>
                          <p className="text-sm text-muted-foreground">Guests arriving</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {todayActivity.checkInsToday}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                          <ArrowDownRight className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">Check-outs Today</p>
                          <p className="text-sm text-muted-foreground">Guests departing</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">
                        {todayActivity.checkOutsToday}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <CalendarCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">New Bookings</p>
                          <p className="text-sm text-muted-foreground">Created today</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {todayActivity.newBookingsToday}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Unable to load today's activity
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Performing Add-ons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Top Performing Add-ons
                </CardTitle>
                <CardDescription>Best selling extras in selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {addonsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : addonPerformance && addonPerformance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Add-on</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addonPerformance.slice(0, 5).map((addon) => (
                        <TableRow key={addon.addonId}>
                          <TableCell className="font-medium">{addon.addonName}</TableCell>
                          <TableCell className="text-right">{addon.totalSold}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(addon.totalRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No add-on sales data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
