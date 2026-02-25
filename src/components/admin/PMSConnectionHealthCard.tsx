import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Clock,
  Server,
  RefreshCw,
  Settings,
  Download,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PMSProviderConfig, getProviderById } from "@/lib/pms-providers";
import type { PMSConnection } from "@/hooks/useAdminPMSHealth";

interface StatusCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}

function StatusCard({ icon, iconBg, label, value }: StatusCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

interface PMSConnectionHealthCardProps {
  connection: PMSConnection | null;
  isLoading: boolean;
  onConfigure: () => void;
  onTestConnection: () => void;
  onSyncNow: () => void;
  onImportProperties: () => void;
  onDelete?: () => void;
  isTestingConnection: boolean;
  isSyncing: boolean;
  isDeleting?: boolean;
  propertyMappingsCount?: number;
}

export function PMSConnectionHealthCard({
  connection,
  isLoading,
  onConfigure,
  onTestConnection,
  onSyncNow,
  onImportProperties,
  onDelete,
  isTestingConnection,
  isSyncing,
  isDeleting = false,
  propertyMappingsCount = 0,
}: PMSConnectionHealthCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-primary" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-6 w-6 text-destructive" />;
      case 'running':
        return <RefreshCw className="h-6 w-6 text-primary animate-spin" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const provider: PMSProviderConfig | undefined = connection
    ? getProviderById((connection.config as { provider?: string })?.provider || 'advancecm')
    : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              PMS Connection Health
            </CardTitle>
            <CardDescription>
              Monitor property management system synchronization
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onConfigure}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            {connection && (
              <Button variant="outline" size="sm" onClick={onImportProperties}>
                <Download className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
            <Button
              size="sm"
              onClick={onSyncNow}
              disabled={isSyncing || !connection}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
            {connection && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : connection ? (
          <div className="grid gap-4 md:grid-cols-4">
            <StatusCard
              icon={
                connection.is_active ? (
                  <CheckCircle className="h-6 w-6 text-primary" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )
              }
              iconBg={
                connection.is_active
                  ? "bg-primary/10"
                  : "bg-destructive/10"
              }
              label="Status"
              value={connection.is_active ? "Connected" : "Disconnected"}
            />
            <StatusCard
              icon={<Activity className="h-6 w-6 text-primary" />}
              iconBg="bg-primary/10"
              label="Provider"
              value={provider?.name || connection.pms_name}
            />
            <StatusCard
              icon={getStatusIcon(connection.sync_status)}
              iconBg="bg-muted"
              label="Sync Status"
              value={connection.sync_status || "Unknown"}
            />
            <StatusCard
              icon={<Clock className="h-6 w-6 text-muted-foreground" />}
              iconBg="bg-muted"
              label="Last Sync"
              value={
                connection.last_sync_at
                  ? formatDistanceToNow(new Date(connection.last_sync_at), {
                      addSuffix: true,
                    })
                  : "Never"
              }
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No PMS Connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect to a Property Management System to sync properties and availability.
            </p>
            <Button onClick={onConfigure}>
              <Settings className="h-4 w-4 mr-2" />
              Configure PMS Integration
            </Button>
          </div>
        )}

        {connection && propertyMappingsCount > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary">
              {propertyMappingsCount} {propertyMappingsCount === 1 ? 'property' : 'properties'} mapped
            </Badge>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove PMS Connection</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>permanently delete all properties</strong> imported through this
              connection, their availability data, seasonal rates, and related records. Sync
              history will be preserved. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.();
                setShowDeleteConfirm(false);
              }}
            >
              Remove Connection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
