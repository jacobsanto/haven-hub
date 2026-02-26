import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown, ArrowUpRight, ArrowDownRight, TrendingUp,
  Megaphone, Calendar, AlertTriangle, ChevronRight,
  Building2, DollarSign, BarChart3, Target, Send,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SocialAnalyticsTab } from '@/components/admin/SocialAnalyticsTab';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import {
  useAnalyticsPropertyPerformance,
  useRevenueIntelligence,
  useCampaignPerformance,
  usePricingStrategy,
  type AnalyticsPropertyRow,
  type PricingSignal,
} from '@/hooks/useAnalyticsV2';

// ─── Sort helper ─────────────────────────────────────────────────

type SortKey = string;

function useSortable<T extends Record<string, any>>(data: T[] | undefined, defaultKey: string, defaultAsc = true) {
  const [sortKey, setSortKey] = useState<string>(defaultKey);
  const [sortAsc, setSortAsc] = useState(defaultAsc);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
      return 0;
    });
  }, [data, sortKey, sortAsc]);

  const toggle = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return { sorted, toggle, sortKey, sortAsc };
}

const SortHeader = ({ label, field, toggle }: { label: string; field: string; toggle: (f: string) => void }) => (
  <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={() => toggle(field)}>
    {label} <ArrowUpDown className="h-3 w-3" />
  </button>
);

const signalLabels: Record<PricingSignal, { label: string; color: string }> = {
  'lower-price': { label: '↓ Lower Price', color: 'text-amber-600' },
  'raise-price': { label: '↑ Raise Price', color: 'text-green-600' },
  'marketing-issue': { label: '📢 Marketing', color: 'text-destructive' },
  'healthy': { label: '✔ Healthy', color: 'text-green-600' },
};

// ─── Component ───────────────────────────────────────────────────

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { format: formatCurrency } = useFormatCurrency();

  const { data: perfData, isLoading: perfLoading } = useAnalyticsPropertyPerformance();
  const { data: revenueData, isLoading: revLoading } = useRevenueIntelligence();
  const { data: campaignData, isLoading: campLoading } = useCampaignPerformance();
  const { data: pricingData, isLoading: priceLoading } = usePricingStrategy();

  const perfSort = useSortable(perfData, 'occupancyPct', true);
  const campSort = useSortable(campaignData, 'conversionPct', true);
  const priceSort = useSortable(pricingData, 'occupancyPct', true);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-5 max-w-[1200px]">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-serif font-medium">Analytics</h1>
            <p className="text-sm text-muted-foreground">Portfolio · Last 30 days</p>
          </div>

          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="performance" className="text-xs gap-1"><Building2 className="h-3.5 w-3.5" /> Performance</TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs gap-1"><DollarSign className="h-3.5 w-3.5" /> Revenue</TabsTrigger>
              <TabsTrigger value="campaigns" className="text-xs gap-1"><Megaphone className="h-3.5 w-3.5" /> Campaigns</TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs gap-1"><Target className="h-3.5 w-3.5" /> Pricing</TabsTrigger>
              <TabsTrigger value="social" className="text-xs gap-1"><Send className="h-3.5 w-3.5" /> Social</TabsTrigger>
            </TabsList>

            {/* ═══ TAB 1: PROPERTY PERFORMANCE ═══ */}
            <TabsContent value="performance">
              <Card>
                <CardContent className="p-4">
                  {perfLoading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : perfSort.sorted.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No active properties</p>
                  ) : (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead><SortHeader label="Property" field="propertyName" toggle={perfSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="Occ %" field="occupancyPct" toggle={perfSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="ADR" field="adr" toggle={perfSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="RevPAR" field="revpar" toggle={perfSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="Revenue" field="revenue" toggle={perfSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="Add-on %" field="addonPct" toggle={perfSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="Cancel %" field="cancellationPct" toggle={perfSort.toggle} /></TableHead>
                            <TableHead className="text-center">Risk</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {perfSort.sorted.map(row => (
                            <TableRow key={row.propertyId}>
                              <TableCell className="font-medium text-sm">{row.propertyName}</TableCell>
                              <TableCell className="text-right text-sm">
                                <span className={row.occupancyPct >= 70 ? 'text-green-600' : row.occupancyPct >= 40 ? 'text-amber-600' : 'text-destructive'}>
                                  {row.occupancyPct.toFixed(0)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(row.adr)}</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(row.revpar)}</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(row.revenue)}</TableCell>
                              <TableCell className="text-right text-sm">{row.addonPct.toFixed(1)}%</TableCell>
                              <TableCell className="text-right text-sm">
                                <span className={row.cancellationPct > 12 ? 'text-destructive' : ''}>{row.cancellationPct.toFixed(1)}%</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                                  row.riskLevel === 'red' ? 'bg-destructive' : row.riskLevel === 'amber' ? 'bg-amber-400' : 'bg-green-500'
                                }`} />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <TooltipProvider>
                                    <Tooltip><TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/admin/rate-plans')}>
                                        <TrendingUp className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger><TooltipContent>Adjust Rate</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/admin/promotions')}>
                                        <Megaphone className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger><TooltipContent>Launch Promotion</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/admin/bookings')}>
                                        <Calendar className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger><TooltipContent>View Calendar</TooltipContent></Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ TAB 2: REVENUE INTELLIGENCE ═══ */}
            <TabsContent value="revenue">
              {revLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1,2,3,4,5,6].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>)}
                </div>
              ) : revenueData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card><CardContent className="p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Revenue</p>
                      <p className="text-lg font-bold mt-1">{formatCurrency(revenueData.revenueThisMonth)}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">vs Last Month</p>
                      <div className={`flex items-center gap-1 mt-1 ${revenueData.changePercent >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {revenueData.changePercent >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        <span className="text-lg font-bold">{Math.abs(revenueData.changePercent).toFixed(1)}%</span>
                      </div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Avg Booking</p>
                      <p className="text-lg font-bold mt-1">{formatCurrency(revenueData.averageBookingValue)}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Add-on %</p>
                      <p className="text-lg font-bold mt-1">{revenueData.addonContributionPct}%</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Cancel Loss %</p>
                      <p className={`text-lg font-bold mt-1 ${revenueData.cancellationLossPct > 10 ? 'text-destructive' : ''}`}>{revenueData.cancellationLossPct}%</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending</p>
                      <p className="text-lg font-bold mt-1 text-amber-600">{formatCurrency(revenueData.pendingRevenue)}</p>
                    </CardContent></Card>
                  </div>

                  {/* Revenue Leak Alerts */}
                  {revenueData.alerts.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold">Revenue Leak Alerts</span>
                        </div>
                        <div className="space-y-1.5">
                          {revenueData.alerts.map(alert => (
                            <div key={alert.key} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
                              <span className="text-sm">{alert.label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : null}
            </TabsContent>

            {/* ═══ TAB 3: MARKETING & CAMPAIGNS ═══ */}
            <TabsContent value="campaigns">
              <Card>
                <CardContent className="p-4">
                  {campLoading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : campSort.sorted.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No campaigns found</p>
                  ) : (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead><SortHeader label="Campaign" field="title" toggle={campSort.toggle} /></TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right"><SortHeader label="Conv %" field="conversionPct" toggle={campSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="Impressions" field="impressions" toggle={campSort.toggle} /></TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campSort.sorted.map(row => (
                            <TableRow key={row.id} className={row.flagLowConversion ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}>
                              <TableCell className="font-medium text-sm">
                                <div className="flex items-center gap-2">
                                  {row.title}
                                  {row.flagLowConversion && (
                                    <Badge className="bg-amber-100 text-amber-700 text-[10px] border-0">Low conv</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{row.type}</TableCell>
                              <TableCell className="text-right text-sm">{row.conversionPct.toFixed(1)}%</TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">{row.impressions}</TableCell>
                              <TableCell>
                                <Badge variant={row.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">
                                  {row.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/campaigns')}>
                                  Edit <ChevronRight className="h-3 w-3 ml-0.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ TAB 4: PRICING STRATEGY ═══ */}
            <TabsContent value="pricing">
              <Card>
                <CardContent className="p-4">
                  {priceLoading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : priceSort.sorted.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No active properties</p>
                  ) : (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead><SortHeader label="Property" field="propertyName" toggle={priceSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="ADR" field="adr" toggle={priceSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="Occ %" field="occupancyPct" toggle={priceSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="ADR vs Avg" field="adrVsAvg" toggle={priceSort.toggle} /></TableHead>
                            <TableHead className="text-right"><SortHeader label="Occ vs Avg" field="occVsAvg" toggle={priceSort.toggle} /></TableHead>
                            <TableHead>Signal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {priceSort.sorted.map(row => {
                            const sig = signalLabels[row.signal];
                            return (
                              <TableRow key={row.propertyId}>
                                <TableCell className="font-medium text-sm">{row.propertyName}</TableCell>
                                <TableCell className="text-right text-sm">{formatCurrency(row.adr)}</TableCell>
                                <TableCell className="text-right text-sm">{row.occupancyPct.toFixed(0)}%</TableCell>
                                <TableCell className="text-right text-sm">
                                  <span className={row.adrVsAvg >= 0 ? 'text-green-600' : 'text-destructive'}>
                                    {row.adrVsAvg >= 0 ? '+' : ''}{row.adrVsAvg.toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  <span className={row.occVsAvg >= 0 ? 'text-green-600' : 'text-destructive'}>
                                    {row.occVsAvg >= 0 ? '+' : ''}{row.occVsAvg.toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`text-xs font-medium ${sig.color}`}>{sig.label}</span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ TAB 5: SOCIAL MEDIA ═══ */}
            <TabsContent value="social">
              <SocialAnalyticsTab />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
