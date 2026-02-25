import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Activity, CheckCircle, XCircle, RefreshCw, Clock, Plus,
  ChevronDown, ChevronRight, AlertTriangle, Shield, Wifi,
  Radio, BarChart3, Settings2, Eye,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import {
  useAllPMSConnections,
  useTestPMSConnection,
  usePMSSyncHistory,
  usePMSPropertyMappings,
  usePMSRawEvents,
  useTriggerManualSync,
  useSyncAllPropertyAvailability,
  useUpdateAutoSyncSettings,
  useDeactivatePMSConnection,
} from '@/hooks/useAdminPMSHealth';
import { PMSConnectionWizard } from '@/components/admin/PMSConnectionWizard';
import { PMSPropertyImportDialog } from '@/components/admin/PMSPropertyImportDialog';
import { getProviderById } from '@/lib/pms-providers';
import { GuestyQuotaMonitor } from '@/components/admin/GuestyQuotaMonitor';

// ─── Helpers ────────────────────────────────────────────────────

function relativeTime(date: string | null) {
  if (!date) return 'Never';
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return format(new Date(date), 'MMM d, HH:mm');
}

type GlobalHealth = 'stable' | 'minor-drift' | 'critical';

function computeGlobalHealth(
  connections: { sync_status: string | null; last_sync_at: string | null }[],
  recentRuns: { status: string; started_at: string }[],
): GlobalHealth {
  if (!connections.length) return 'critical';

  const now = Date.now();
  const failedLast24h = recentRuns.filter(
    r => r.status === 'failed' && now - new Date(r.started_at).getTime() < 86400000,
  ).length;

  const anyError = connections.some(c => c.sync_status === 'error');
  const stalest = connections.reduce((max, c) => {
    if (!c.last_sync_at) return Infinity;
    return Math.max(max, now - new Date(c.last_sync_at).getTime());
  }, 0);
  const staleHours = stalest / 3600000;

  if (anyError || failedLast24h >= 3 || staleHours > 6) return 'critical';
  if (failedLast24h > 0 || staleHours > 2) return 'minor-drift';
  return 'stable';
}

// ─── Sync Matrix Row ────────────────────────────────────────────

interface SyncDomain {
  domain: string;
  status: 'ok' | 'warning' | 'error' | 'idle';
  lastSync: string | null;
  failures24h: number;
  driftCount: number | null;
}

function buildSyncMatrix(
  runs: { sync_type: string; status: string; started_at: string; completed_at: string | null; records_failed: number | null }[],
  connections: { last_sync_at: string | null }[],
  webhookEvents: { created_at: string; error_message: string | null }[],
): SyncDomain[] {
  const now = Date.now();
  const last24h = runs.filter(r => now - new Date(r.started_at).getTime() < 86400000);

  const domainMap: Record<string, { runs: typeof last24h }> = {
    availability: { runs: [] },
    bookings: { runs: [] },
    rates: { runs: [] },
  };

  for (const r of last24h) {
    const type = r.sync_type.toLowerCase();
    if (type.includes('avail') || type.includes('ical') || type === 'property') {
      domainMap.availability.runs.push(r);
    } else if (type.includes('booking')) {
      domainMap.bookings.runs.push(r);
    } else if (type.includes('rate')) {
      domainMap.rates.runs.push(r);
    } else {
      domainMap.availability.runs.push(r); // default bucket
    }
  }

  const domains: SyncDomain[] = Object.entries(domainMap).map(([domain, { runs: dRuns }]) => {
    const failures = dRuns.filter(r => r.status === 'failed').length;
    const lastRun = dRuns.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
    const status: SyncDomain['status'] =
      !lastRun ? 'idle' :
      failures >= 2 ? 'error' :
      failures > 0 ? 'warning' : 'ok';

    return {
      domain: domain.charAt(0).toUpperCase() + domain.slice(1),
      status,
      lastSync: lastRun?.completed_at || lastRun?.started_at || connections[0]?.last_sync_at || null,
      failures24h: failures,
      driftCount: null,
    };
  });

  // Webhooks domain
  const recent24hEvents = webhookEvents.filter(e => now - new Date(e.created_at).getTime() < 86400000);
  const webhookErrors = recent24hEvents.filter(e => e.error_message).length;
  const lastEvent = webhookEvents[0];
  const webhookStale = !lastEvent || (now - new Date(lastEvent.created_at).getTime() > 86400000);

  domains.push({
    domain: 'Webhooks',
    status: webhookErrors >= 2 ? 'error' : webhookStale ? 'warning' : webhookErrors > 0 ? 'warning' : 'ok',
    lastSync: lastEvent?.created_at || null,
    failures24h: webhookErrors,
    driftCount: null,
  });

  return domains;
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'ok': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">OK</Badge>;
    case 'warning': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Warning</Badge>;
    case 'error': return <Badge variant="destructive">Error</Badge>;
    default: return <Badge variant="secondary">Idle</Badge>;
  }
};

// ─── Component ──────────────────────────────────────────────────

export default function AdminPMSHealth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importConnectionId, setImportConnectionId] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);

  // Data
  const { data: connections, isLoading: connLoading } = useAllPMSConnections();
  const activeConn = connections?.[0];
  const { data: syncHistory, isLoading: histLoading } = usePMSSyncHistory(activeConn?.id, 50);
  const { data: propertyMappings } = usePMSPropertyMappings(activeConn?.id);
  const { data: rawEvents } = usePMSRawEvents(50);

  // Mutations
  const triggerSync = useTriggerManualSync();
  const syncAll = useSyncAllPropertyAvailability();
  const deactivateConnection = useDeactivatePMSConnection();

  const globalHealth = connections && syncHistory
    ? computeGlobalHealth(connections, syncHistory)
    : 'stable';

  const syncMatrix = syncHistory && connections && rawEvents
    ? buildSyncMatrix(syncHistory, connections, rawEvents)
    : [];

  // Last reconciliation = last full sync that touched all properties
  const lastFullSync = syncHistory?.find(r => r.sync_type === 'full' || r.sync_type === 'availability');

  const handleForceSync = async (domain: string) => {
    if (!activeConn) return;
    try {
      if (domain === 'Availability') {
        const result = await syncAll.mutateAsync(activeConn.id);
        toast({ title: result.failed === 0 ? 'Availability Synced' : 'Partial Sync', description: `Synced ${result.synced}/${result.total} properties.` });
      } else {
        const result = await triggerSync.mutateAsync(activeConn.id);
        toast({ title: result.success ? 'Sync Complete' : 'Sync Failed', description: `Processed ${result.recordsProcessed} records.` });
      }
    } catch (error) {
      toast({ title: 'Sync Failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const handleRunFullAudit = async () => {
    if (!activeConn) return;
    try {
      const result = await syncAll.mutateAsync(activeConn.id);
      toast({ title: 'Full Sync Audit Complete', description: `${result.synced} synced, ${result.failed} failed out of ${result.total}.` });
    } catch (error) {
      toast({ title: 'Audit Failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const providerConfig = activeConn
    ? getProviderById((activeConn.config as { provider?: string } | null)?.provider || 'advancecm')
    : null;

  const isGuesty = (activeConn?.config as { provider?: string } | null)?.provider === 'guesty';

  if (connLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-[1200px]">
          <Skeleton className="h-8 w-64" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-[1200px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-medium">PMS Health</h1>
            <p className="text-sm text-muted-foreground">Unified sync control center</p>
          </div>
          <Button onClick={() => setShowConfigDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Connection
          </Button>
        </div>

        {/* ═══ 1. GLOBAL SYNC STATUS ═══ */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${
                  globalHealth === 'stable' ? 'bg-green-500' :
                  globalHealth === 'minor-drift' ? 'bg-amber-400' : 'bg-destructive'
                }`} />
                <span className="text-sm font-semibold">
                  {globalHealth === 'stable' ? '🟢 Stable' :
                   globalHealth === 'minor-drift' ? '🟠 Minor Drift' : '🔴 Critical'}
                </span>
                {activeConn && (
                  <span className="text-xs text-muted-foreground">
                    · {providerConfig?.name || activeConn.pms_name} · Last sync: {relativeTime(activeConn.last_sync_at)}
                  </span>
                )}
              </div>
              {!activeConn && (
                <Badge variant="outline" className="text-xs">No connection</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══ 2. SYNC MATRIX ═══ */}
        {activeConn && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Sync Matrix</span>
              </div>
              {histLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="text-center">Failures (24h)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncMatrix.map(row => (
                      <TableRow key={row.domain}>
                        <TableCell className="font-medium text-sm">{row.domain}</TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{relativeTime(row.lastSync)}</TableCell>
                        <TableCell className="text-center">
                          {row.failures24h > 0 ? (
                            <span className="text-destructive font-medium">{row.failures24h}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleForceSync(row.domain)}
                              disabled={triggerSync.isPending || syncAll.isPending}
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${(triggerSync.isPending || syncAll.isPending) ? 'animate-spin' : ''}`} />
                              Force Sync
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setLogsOpen(true)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Logs
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══ 3. DAILY AUTO RECONCILIATION ═══ */}
        {activeConn && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Reconciliation</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleRunFullAudit}
                  disabled={syncAll.isPending}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${syncAll.isPending ? 'animate-spin' : ''}`} />
                  Run Full Sync Audit
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  {lastFullSync?.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : lastFullSync?.status === 'failed' ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {lastFullSync
                        ? lastFullSync.status === 'success' ? '✔ Success' : '⚠ Issues detected'
                        : 'No reconciliation yet'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lastFullSync ? relativeTime(lastFullSync.completed_at || lastFullSync.started_at) : 'Run an audit to check'}
                    </p>
                  </div>
                </div>
                {lastFullSync && (lastFullSync.records_failed ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600 font-medium">
                      {lastFullSync.records_failed} drift{(lastFullSync.records_failed ?? 0) > 1 ? 's' : ''} detected
                    </span>
                  </div>
                )}
                {propertyMappings && (
                  <span className="text-xs text-muted-foreground">
                    {propertyMappings.length} mapped properties
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ 4. AUTO-SYNC CONFIG STRIP ═══ */}
        {activeConn && (
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Frequency:</span>
                  <span className="text-xs text-muted-foreground">Every {activeConn.sync_interval_minutes}min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Webhook:</span>
                  <span className="text-xs text-muted-foreground">
                    {rawEvents && rawEvents.length > 0 ? 'Active' : 'No events'}
                  </span>
                </div>
                {isGuesty && (
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">API Quota:</span>
                    <span className="text-xs text-muted-foreground">See below</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Auto-sync:</span>
                  <span className={`text-xs ${activeConn.auto_sync_enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {activeConn.auto_sync_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Last full sync:</span>
                  <span className="text-xs text-muted-foreground">{relativeTime(activeConn.last_sync_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guesty Quota Monitor (if applicable) */}
        {isGuesty && <GuestyQuotaMonitor />}

        {/* ═══ 5. COLLAPSIBLE SYNC LOGS ═══ */}
        {activeConn && (
          <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {logsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="text-sm font-semibold">Sync Logs</span>
                      {syncHistory && (
                        <Badge variant="secondary" className="text-[10px]">{syncHistory.length}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t">
                  {histLoading ? (
                    <div className="p-4 space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  ) : syncHistory && syncHistory.length > 0 ? (
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Domain</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {syncHistory.slice(0, 30).map(run => {
                            const duration = run.completed_at && run.started_at
                              ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                              : null;
                            return (
                              <TableRow key={run.id}>
                                <TableCell className="text-xs">{format(new Date(run.started_at), 'MMM d, HH:mm:ss')}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px] capitalize">{run.sync_type}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{duration !== null ? `${duration}s` : '-'}</TableCell>
                                <TableCell>
                                  {run.status === 'success' ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]">OK</Badge>
                                  ) : run.status === 'failed' ? (
                                    <Badge variant="destructive" className="text-[10px]">Fail</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px]">{run.status}</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                  {run.error_summary || '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">No sync logs yet</div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* No connection state */}
        {!activeConn && (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium">No PMS connection configured</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Add a connection to start syncing properties and availability.</p>
              <Button onClick={() => setShowConfigDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Connection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <PMSConnectionWizard
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        onConnectionEstablished={() => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'pms'] });
        }}
      />

      {importConnectionId && (() => {
        const conn = connections?.find(c => c.id === importConnectionId);
        const config = conn?.config as { provider?: string } | null;
        return (
          <PMSPropertyImportDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            connectionId={importConnectionId}
            providerName={conn?.pms_name}
            providerId={config?.provider}
          />
        );
      })()}
    </AdminLayout>
  );
}
