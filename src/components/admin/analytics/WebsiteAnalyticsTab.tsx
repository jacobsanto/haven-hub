import { motion } from 'framer-motion';
import { 
  Users, 
  Eye, 
  LogOut, 
  Clock,
  FileText,
  Monitor,
  Smartphone,
  Tablet,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Cell,
  Legend,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useWebsiteAnalytics, formatDuration } from '@/hooks/useWebsiteAnalytics';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(217 91% 60%)',
  'hsl(48 96% 53%)',
  'hsl(280 65% 60%)',
  'hsl(0 84% 60%)',
];

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "hsl(var(--primary))",
  },
  pageviews: {
    label: "Page Views",
    color: "hsl(142 76% 36%)",
  },
} satisfies ChartConfig;

interface WebsiteAnalyticsTabProps {
  dateRange: { start: Date; end: Date };
}

export function WebsiteAnalyticsTab({ dateRange }: WebsiteAnalyticsTabProps) {
  const { data, isLoading, error } = useWebsiteAnalytics(dateRange);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Unable to load website analytics</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Visitors',
      value: data?.summary.visitors.toLocaleString() ?? '—',
      icon: Users,
      description: 'Unique visitors',
    },
    {
      title: 'Page Views',
      value: data?.summary.pageviews.toLocaleString() ?? '—',
      icon: Eye,
      description: 'Total page loads',
    },
    {
      title: 'Bounce Rate',
      value: data ? `${data.summary.bounceRate}%` : '—',
      icon: LogOut,
      description: 'Single-page sessions',
    },
    {
      title: 'Avg Session',
      value: data ? formatDuration(data.summary.avgSessionDuration) : '—',
      icon: Clock,
      description: 'Time on site',
    },
    {
      title: 'Pages/Visit',
      value: data?.summary.pageviewsPerVisit ?? '—',
      icon: FileText,
      description: 'Engagement depth',
    },
  ];

  const deviceIcons: Record<string, typeof Monitor> = {
    Desktop: Monitor,
    Mobile: Smartphone,
    Tablet: Tablet,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
      >
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Visitors Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Visitors Trend</CardTitle>
            <CardDescription>Daily visitors and page views over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.daily && data.daily.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="var(--color-visitors)" 
                      strokeWidth={2}
                      dot={false}
                      name="Visitors"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="pageviews" 
                      stroke="var(--color-pageviews)" 
                      strokeWidth={2}
                      dot={false}
                      name="Page Views"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No traffic data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : data?.sources && data.sources.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.sources}
                        dataKey="percentage"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ source, percentage }) => `${source}: ${percentage}%`}
                        labelLine={false}
                      >
                        {data.sources.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${props.payload.visitors.toLocaleString()} visitors (${value}%)`,
                          props.payload.source
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No traffic source data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Visitors by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : data?.devices && data.devices.length > 0 ? (
                <div className="space-y-4">
                  {data.devices.map((device) => {
                    const Icon = deviceIcons[device.device] || Monitor;
                    return (
                      <div key={device.device} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{device.device}</span>
                            <span className="text-muted-foreground">
                              {device.visitors.toLocaleString()} ({device.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${device.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No device data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Top Pages
              </CardTitle>
              <CardDescription>Most visited pages on your site</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : data?.pages && data.pages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pages.slice(0, 6).map((page) => (
                      <TableRow key={page.path}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{page.title}</p>
                            <p className="text-xs text-muted-foreground">{page.path}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{page.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No page data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Geographic Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Visitors by country</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : data?.countries && data.countries.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.countries.slice(0, 6)} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis 
                        type="number"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        dataKey="country" 
                        type="category"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value) => [`${(value as number).toLocaleString()} visitors`, 'Visitors']}
                      />
                      <Bar 
                        dataKey="visitors" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No geographic data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
