import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Link as LinkIcon,
  Clock,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  usePMSConnectionStatus,
  useTestPMSConnection,
  usePMSSyncHistory,
  usePMSPropertyMappings,
  usePMSRawEvents,
  useTriggerManualSync,
  useTogglePropertySync,
  useSyncPropertyNow,
  useSyncAllPropertyAvailability,
  useUpdateAutoSyncSettings,
  useTriggerReconciliation,
} from '@/hooks/useAdminPMSHealth';
import { PMSConfigDialog } from '@/components/admin/PMSConfigDialog';
import { PMSPropertyImportDialog } from '@/components/admin/PMSPropertyImportDialog';
import { PMSConnectionHealthCard } from '@/components/admin/PMSConnectionHealthCard';
import { PMSSyncStatusPanel } from '@/components/admin/PMSSyncStatusPanel';
import { AutoSyncSettingsCard } from '@/components/admin/AutoSyncSettingsCard';
import { WebhookTesterCard } from '@/components/admin/WebhookTesterCard';
import { getProviderById } from '@/lib/pms-providers';

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Success</Badge>;
    case 'error':
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'running':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Running</Badge>;
    case 'idle':
      return <Badge variant="secondary">Idle</Badge>;
    default:
      return <Badge variant="outline">{status || 'Unknown'}</Badge>;
  }
};

export default function AdminPMSHealth() {
  const { toast } = useToast();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [syncingPropertyId, setSyncingPropertyId] = useState<string | null>(null);

  // Data hooks
  const { data: connection, isLoading: connectionLoading } = usePMSConnectionStatus();
  const { data: syncHistory, isLoading: historyLoading } = usePMSSyncHistory(connection?.id, 20);
  const { data: propertyMappings, isLoading: mappingsLoading } = usePMSPropertyMappings(connection?.id);
  const { data: rawEvents, isLoading: eventsLoading } = usePMSRawEvents(50);

  // Mutations
  const testConnection = useTestPMSConnection();
  const triggerSync = useTriggerManualSync();
  const togglePropertySync = useTogglePropertySync();
  const syncPropertyNow = useSyncPropertyNow();
  const syncAllAvailability = useSyncAllPropertyAvailability();
  const updateAutoSyncSettings = useUpdateAutoSyncSettings();
  const triggerReconciliation = useTriggerReconciliation();

  // Get provider config from connection
  const connectionConfig = connection?.config as { provider?: string } | null;
  const currentProviderId = connectionConfig?.provider || 'advancecm';
  const currentProvider = getProviderById(currentProviderId);

  const handleUpdateSyncSettings = async (settings: { autoSyncEnabled?: boolean; syncIntervalMinutes?: number }) => {
    if (!connection) return;
    await updateAutoSyncSettings.mutateAsync({
      connectionId: connection.id,
      ...settings,
    });
  };

  const handleTestConnection = async () => {
    try {
      const result = await testConnection.mutateAsync();
      toast({
        title: result.success ? 'Connection Successful' : 'Connection Failed',
        description: result.success 
          ? 'PMS connection is working properly.' 
          : 'Unable to connect to PMS. Check your configuration.',
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleManualSync = async () => {
    if (!connection) return;
    try {
      const result = await triggerSync.mutateAsync(connection.id);
      toast({
        title: result.success ? 'Sync Complete' : 'Sync Failed',
        description: result.success 
          ? `Processed ${result.recordsProcessed} records.` 
          : 'Sync encountered errors. Check the history for details.',
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePropertySync = async (mappingId: string, enabled: boolean) => {
    try {
      await togglePropertySync.mutateAsync({ mappingId, enabled });
      toast({
        title: enabled ? 'Sync Enabled' : 'Sync Disabled',
        description: `Property sync has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleSyncPropertyNow = async (externalPropertyId: string) => {
    if (!connection) return;
    setSyncingPropertyId(externalPropertyId);
    try {
      const result = await syncPropertyNow.mutateAsync({ 
        connectionId: connection.id, 
        externalPropertyId 
      });
      toast({
        title: result.success ? 'Property Synced' : 'Sync Failed',
        description: result.success 
          ? `Processed ${result.recordsProcessed} records.` 
          : 'Property sync encountered errors.',
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSyncingPropertyId(null);
    }
  };

  const handleSyncAllAvailability = async () => {
    if (!connection) return;
    try {
      const result = await syncAllAvailability.mutateAsync(connection.id);
      toast({
        title: result.failed === 0 ? 'Availability Synced' : 'Partial Sync',
        description: `Synced ${result.synced} of ${result.total} properties.${result.failed > 0 ? ` ${result.failed} failed.` : ''}`,
        variant: result.failed === 0 ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleReconciliation = async () => {
    try {
      const result = await triggerReconciliation.mutateAsync();
      toast({
        title: result.success ? 'Reconciliation Complete' : 'Reconciliation Issues',
        description: result.message || `Checked ${result.summary?.checked || 0} bookings`,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Reconciliation Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">PMS Health</h1>
          <p className="text-muted-foreground">
            Monitor and configure property management system integration
          </p>
        </motion.div>

        {/* Connection Health Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PMSConnectionHealthCard
            connection={connection || null}
            isLoading={connectionLoading}
            onConfigure={() => setShowConfigDialog(true)}
            onTestConnection={handleTestConnection}
            onSyncNow={handleManualSync}
            onImportProperties={() => setShowImportDialog(true)}
            isTestingConnection={testConnection.isPending}
            isSyncing={triggerSync.isPending}
            propertyMappingsCount={propertyMappings?.length}
          />
        </motion.div>

        {/* Sync Status Panel */}
        {currentProvider && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <PMSSyncStatusPanel
              provider={currentProvider}
              isConnected={!!connection?.is_active}
              lastSyncAt={connection?.last_sync_at}
              propertyCount={propertyMappings?.length}
            />
          </motion.div>
        )}

        {/* Auto-Sync Settings Card */}
        {connection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <AutoSyncSettingsCard
              connectionId={connection.id}
              autoSyncEnabled={connection.auto_sync_enabled ?? true}
              syncIntervalMinutes={connection.sync_interval_minutes ?? 5}
              lastScheduledSync={connection.last_sync_at}
              onUpdateSettings={handleUpdateSyncSettings}
              isUpdating={updateAutoSyncSettings.isPending}
              projectId="xavjbiuhcmupsoocrmhf"
            />
          </motion.div>
        )}

        {/* Daily Reconciliation Card */}
        {connection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Daily Booking Reconciliation
                </CardTitle>
                <CardDescription>
                  Compares active bookings from Tokeet with local records to detect date modifications, 
                  new OTA bookings, and cancellations. Runs automatically daily at 2 AM.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleReconciliation}
                    disabled={triggerReconciliation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${triggerReconciliation.isPending ? 'animate-spin' : ''}`} />
                    Run Reconciliation Now
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Manually trigger a full booking reconciliation to sync dates and detect changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Webhook Tester Card */}
        {connection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <WebhookTesterCard 
              propertyMappings={propertyMappings} 
              isLoading={mappingsLoading} 
            />
          </motion.div>
        )}

        {/* Tabs for different views */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="mappings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="mappings">Property Mappings</TabsTrigger>
              <TabsTrigger value="history">Sync History</TabsTrigger>
              <TabsTrigger value="events">Webhook Events</TabsTrigger>
            </TabsList>

            {/* Property Mappings Tab */}
            <TabsContent value="mappings">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Property Mappings</CardTitle>
                    <CardDescription>
                      Map local properties to external PMS listings
                    </CardDescription>
                  </div>
                  {propertyMappings && propertyMappings.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncAllAvailability}
                      disabled={syncAllAvailability.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncAllAvailability.isPending ? 'animate-spin' : ''}`} />
                      Sync All Availability
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {mappingsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : propertyMappings && propertyMappings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Local Property</TableHead>
                          <TableHead>External ID</TableHead>
                          <TableHead>External Name</TableHead>
                          <TableHead>Last Availability Sync</TableHead>
                          <TableHead>Sync Enabled</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {propertyMappings.map((mapping) => (
                          <TableRow key={mapping.id}>
                            <TableCell className="font-medium">
                              {mapping.property?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {mapping.external_property_id}
                              </code>
                            </TableCell>
                            <TableCell>{mapping.external_property_name || '-'}</TableCell>
                            <TableCell>
                              {mapping.last_availability_sync_at 
                                ? format(new Date(mapping.last_availability_sync_at), 'MMM d, HH:mm')
                                : 'Never'}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={mapping.sync_enabled}
                                onCheckedChange={(checked) => handleTogglePropertySync(mapping.id, checked)}
                                disabled={togglePropertySync.isPending}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSyncPropertyNow(mapping.external_property_id)}
                                disabled={syncingPropertyId !== null || !mapping.sync_enabled}
                              >
                                <RefreshCw className={`h-4 w-4 mr-1 ${syncingPropertyId === mapping.external_property_id ? 'animate-spin' : ''}`} />
                                Sync
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No property mappings configured.</p>
                      <p className="text-sm">Import properties from your PMS to create mappings.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sync History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Sync History</CardTitle>
                  <CardDescription>
                    Recent synchronization runs and their results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : syncHistory && syncHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Started</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Processed</TableHead>
                          <TableHead>Failed</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncHistory.map((run) => {
                          const duration = run.completed_at && run.started_at
                            ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                            : null;
                          return (
                            <TableRow key={run.id}>
                              <TableCell>
                                {format(new Date(run.started_at), 'MMM d, HH:mm:ss')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {run.sync_type}
                                </Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(run.status)}</TableCell>
                              <TableCell>
                                {duration !== null ? `${duration}s` : '-'}
                              </TableCell>
                              <TableCell>{run.records_processed ?? '-'}</TableCell>
                              <TableCell>
                                {run.records_failed !== null && run.records_failed > 0 ? (
                                  <span className="text-destructive">{run.records_failed}</span>
                                ) : (
                                  run.records_failed ?? '-'
                                )}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {run.error_summary || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sync history available.</p>
                      <p className="text-sm">Run a sync to see results here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhook Events Tab */}
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Events</CardTitle>
                  <CardDescription>
                    Raw events received from the PMS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : rawEvents && rawEvents.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {rawEvents.map((event) => (
                        <AccordionItem key={event.id} value={event.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-4 text-left w-full pr-4">
                              <div className="flex-shrink-0">
                                {event.processed ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : event.error_message ? (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {event.event_type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    from {event.source}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              {event.error_message && (
                                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                  <p className="text-sm text-destructive">
                                    <strong>Error:</strong> {event.error_message}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium mb-2">Payload:</p>
                                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-[300px]">
                                  {JSON.stringify(event.payload, null, 2)}
                                </pre>
                              </div>
                              {event.processed_at && (
                                <p className="text-xs text-muted-foreground">
                                  Processed: {format(new Date(event.processed_at), 'MMM d, yyyy HH:mm:ss')}
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No webhook events recorded.</p>
                      <p className="text-sm">Events will appear here when received from the PMS.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Dialogs */}
      <PMSConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        currentProvider={currentProviderId}
        onConnectionEstablished={() => {
          // Refetch connection data
          window.location.reload();
        }}
      />

      {connection && (
        <PMSPropertyImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          connectionId={connection.id}
        />
      )}
    </AdminLayout>
  );
}
