import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  Building2, Calendar, ChevronRight, FileText, Mail, 
  Megaphone, Package, Settings, TrendingUp, Zap,
  CheckCircle2, HelpCircle, XCircle, ArrowUpDown
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import {
  useActionCenter,
  usePropertyPerformance,
  useRevenueSnapshot,
  useSystemHealth,
  type PropertyPerformanceRow,
} from '@/hooks/useDashboardData';
import { useState, useMemo } from 'react';

// ─── Sorting ────────────────────────────────────────────────────

type SortKey = 'propertyName' | 'occupancyPct' | 'revenue' | 'addonPct' | 'feePct' | 'riskLevel';

function sortRows(rows: PropertyPerformanceRow[], key: SortKey, asc: boolean) {
  return [...rows].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (typeof va === 'string' && typeof vb === 'string') return asc ? va.localeCompare(vb) : vb.localeCompare(va);
    if (typeof va === 'number' && typeof vb === 'number') return asc ? va - vb : vb - va;
    return 0;
  });
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { format: formatCurrency } = useFormatCurrency();
  useRealtimeBookings();

  const { data: actions, isLoading: actionsLoading } = useActionCenter();
  const { data: perfRows, isLoading: perfLoading } = usePropertyPerformance();
  const { data: revenue, isLoading: revLoading } = useRevenueSnapshot();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

  const [sortKey, setSortKey] = useState<SortKey>('occupancyPct');
  const [sortAsc, setSortAsc] = useState(true);

  const sortedPerf = useMemo(() => {
    if (!perfRows) return [];
    return sortRows(perfRows, sortKey, sortAsc);
  }, [perfRows, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const criticalItems = actions?.filter(a => a.severity === 'critical') || [];
  const importantItems = actions?.filter(a => a.severity === 'important') || [];

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6 max-w-[1200px]">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-serif font-medium">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Action-first overview</p>
          </div>

          {/* ═══ 1. ACTION CENTER ═══ */}
          {(actionsLoading || criticalItems.length > 0 || importantItems.length > 0) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-semibold">Action Center</span>
                </div>

                {actionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : (
                  <>
                    {/* Critical */}
                    {criticalItems.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-destructive uppercase tracking-wider">🔴 Critical</p>
                        {criticalItems.map(item => (
                          <div key={item.key} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-destructive/5 border border-destructive/10">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.label}</span>
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{item.count}</Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(item.href)}>
                              View <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Important */}
                    {importantItems.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">🟠 Important</p>
                        {importantItems.map(item => (
                          <div key={item.key} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-amber-50 border border-amber-100">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.label}</span>
                              <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 border-0">{item.count}</Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(item.href)}>
                              View <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ 2. PROPERTY PERFORMANCE ═══ */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Property Performance (30 days)</span>
              </div>

              {perfLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : sortedPerf.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No active properties</p>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><SortHeader label="Property" field="propertyName" /></TableHead>
                        <TableHead className="text-right"><SortHeader label="Occupancy %" field="occupancyPct" /></TableHead>
                        <TableHead className="text-right"><SortHeader label="Revenue" field="revenue" /></TableHead>
                        <TableHead className="text-right"><SortHeader label="Add-on %" field="addonPct" /></TableHead>
                        <TableHead className="text-right"><SortHeader label="Fee %" field="feePct" /></TableHead>
                        <TableHead className="text-center"><SortHeader label="Risk" field="riskLevel" /></TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPerf.map(row => (
                        <TableRow key={row.propertyId}>
                          <TableCell className="font-medium text-sm">{row.propertyName}</TableCell>
                          <TableCell className="text-right text-sm">
                            <span className={
                              row.occupancyPct >= 70 ? 'text-green-600' :
                              row.occupancyPct >= 40 ? 'text-amber-600' : 'text-destructive'
                            }>
                              {row.occupancyPct.toFixed(0)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(row.revenue)}</TableCell>
                          <TableCell className="text-right text-sm">{row.addonPct.toFixed(1)}%</TableCell>
                          <TableCell className="text-right text-sm">{row.feePct.toFixed(1)}%</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                              row.riskLevel === 'red' ? 'bg-destructive' :
                              row.riskLevel === 'amber' ? 'bg-amber-400' : 'bg-green-500'
                            }`} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/admin/rate-plans')}>
                                      <TrendingUp className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Adjust Rate</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/admin/promotions')}>
                                      <Megaphone className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Launch Promotion</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/admin/bookings')}>
                                      <Calendar className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Calendar</TooltipContent>
                                </Tooltip>
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

          {/* ═══ 3. REVENUE SNAPSHOT ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {revLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))
            ) : revenue ? (
              <>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Revenue</p>
                    <p className="text-lg font-bold mt-1">{formatCurrency(revenue.revenueThisMonth)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">vs Last Month</p>
                    <div className={`flex items-center gap-1 mt-1 ${revenue.changePercent >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {revenue.changePercent >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <span className="text-lg font-bold">{Math.abs(revenue.changePercent).toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Avg Booking</p>
                    <p className="text-lg font-bold mt-1">{formatCurrency(revenue.averageBookingValue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Add-on %</p>
                    <p className="text-lg font-bold mt-1">{revenue.addonContributionPct}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending</p>
                    <p className="text-lg font-bold mt-1 text-amber-600">{formatCurrency(revenue.pendingRevenue)}</p>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* ═══ 4. SYSTEM HEALTH STRIP ═══ */}
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-4">
                {healthLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-32" />)
                ) : health?.map(item => {
                  const Icon = item.status === 'ok' ? CheckCircle2 :
                               item.status === 'warning' ? AlertTriangle :
                               item.status === 'error' ? XCircle : HelpCircle;
                  const color = item.status === 'ok' ? 'text-green-600' :
                                item.status === 'warning' ? 'text-amber-500' :
                                item.status === 'error' ? 'text-destructive' : 'text-muted-foreground';
                  return (
                    <div key={item.key} className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className="text-xs font-medium">{item.label}</span>
                      {item.detail && <span className="text-[10px] text-muted-foreground">· {item.detail}</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ═══ 5. QUICK EXECUTION PANEL ═══ */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Quick Actions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Revenue */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Revenue</p>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate('/admin/promotions')}>
                    <Megaphone className="h-3.5 w-3.5 mr-2" /> Create Promotion
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate('/admin/rate-plans')}>
                    <TrendingUp className="h-3.5 w-3.5 mr-2" /> Adjust Rate
                  </Button>
                </div>
                {/* Content */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Content</p>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate('/admin/blog')}>
                    <FileText className="h-3.5 w-3.5 mr-2" /> Create Article
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate('/admin/newsletter')}>
                    <Mail className="h-3.5 w-3.5 mr-2" /> Schedule Newsletter
                  </Button>
                </div>
                {/* Operations */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Operations</p>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate('/admin/properties')}>
                    <Building2 className="h-3.5 w-3.5 mr-2" /> Add Property
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" onClick={() => navigate('/admin/pms-health')}>
                    <Settings className="h-3.5 w-3.5 mr-2" /> Open PMS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
