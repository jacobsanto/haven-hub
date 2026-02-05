import { useState } from 'react';
import { motion } from 'framer-motion';
import { startOfMonth, endOfMonth, subMonths, subDays, startOfYear } from 'date-fns';
import { Calendar, TrendingUp, Globe } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueAnalyticsTab } from '@/components/admin/analytics/RevenueAnalyticsTab';
import { WebsiteAnalyticsTab } from '@/components/admin/analytics/WebsiteAnalyticsTab';

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

export default function AdminAnalytics() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('last_3_months');
  const [activeTab, setActiveTab] = useState('revenue');
  const dateRange = getDateRange(datePreset);

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
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Track your business and website performance
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue Analytics
            </TabsTrigger>
            <TabsTrigger value="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-6">
            <RevenueAnalyticsTab dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="website" className="mt-6">
            <WebsiteAnalyticsTab dateRange={dateRange} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
