import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Link as LinkIcon,
  Server,
  Clock,
  ArrowRight,
  Download,
  Settings
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
  type PMSRawEvent,
} from '@/hooks/useAdminPMSHealth';
import { PMSConfigDialog } from '@/components/admin/PMSConfigDialog';
import { PMSPropertyImportDialog } from '@/components/admin/PMSPropertyImportDialog';

const getStatusIcon = (status: string | null) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'error':
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'running':
      return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  }
};

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
  const [selectedEvent, setSelectedEvent] = useState<PMSRawEvent | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

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
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">PMS Health</h1>
            <p className="text-muted-foreground">
              Monitor property management system synchronization
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfigDialog(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            {connection && (
              <Button 
                variant="outline" 
                onClick={() => setShowImportDialog(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Import Properties
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testConnection.isPending}
            >
              {testConnection.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button 
              onClick={handleManualSync}
              disabled={triggerSync.isPending || !connection}
            >
              {triggerSync.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
          </div>
        </motion.div>

        {/* Connection Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription>Current PMS connection and sync status</CardDescription>
            </CardHeader>
            <CardContent>
              {connectionLoading ? (
                <div className="grid gap-4 md:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : connection ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      connection.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {connection.is_active ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-semibold">{connection.is_active ? 'Connected' : 'Disconnected'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PMS Provider</p>
                      <p className="font-semibold">{connection.pms_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      {getStatusIcon(connection.sync_status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sync Status</p>
                      <p className="font-semibold capitalize">{connection.sync_status || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Sync</p>
                      <p className="font-semibold">
                        {connection.last_sync_at 
                          ? formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No PMS Connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect to AdvanceCM (Tokeet) to sync properties and availability.
                  </p>
                  <Button onClick={() => setShowConfigDialog(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure AdvanceCM
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

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
                <CardHeader>
                  <CardTitle>Property Mappings</CardTitle>
                  <CardDescription>
                    Map local properties to external PMS listings
                  </CardDescription>
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
                          <TableHead>Last Sync</TableHead>
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
                              {mapping.last_sync_at 
                                ? format(new Date(mapping.last_sync_at), 'MMM d, HH:mm')
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
                                disabled={syncPropertyNow.isPending || !mapping.sync_enabled}
                              >
                                <RefreshCw className={`h-4 w-4 mr-1 ${syncPropertyNow.isPending ? 'animate-spin' : ''}`} />
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
                      <p className="text-sm">Properties will be mapped automatically during sync.</p>
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
                                  <span className="text-red-600">{run.records_failed}</span>
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
                                  <XCircle className="h-4 w-4 text-red-600" />
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
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                  <p className="text-sm text-red-800 dark:text-red-200">
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

        {/* Two-Way Sync Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Bidirectional Sync Status
              </CardTitle>
              <CardDescription>
                Real-time sync between your booking engine and the PMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Pull from PMS</h4>
                      <p className="text-sm text-muted-foreground">Availability, rates, fees</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Availability</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rates</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fees & Taxes</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <ArrowRight className="h-5 w-5 text-purple-600 rotate-180" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Push to PMS</h4>
                      <p className="text-sm text-muted-foreground">Bookings, cancellations</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Bookings</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancellations</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modifications</span>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialogs */}
      <PMSConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
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
