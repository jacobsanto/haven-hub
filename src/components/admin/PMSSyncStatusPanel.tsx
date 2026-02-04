import { ArrowDown, ArrowUp, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PMSProviderConfig } from "@/lib/pms-providers";

interface SyncCapabilityCardProps {
  direction: 'pull' | 'push';
  label: string;
  enabled: boolean;
  active: boolean;
  lastSync?: string | null;
  count?: number;
}

function SyncCapabilityCard({
  direction,
  label,
  enabled,
  active,
  lastSync,
  count,
}: SyncCapabilityCardProps) {
  const Icon = direction === 'pull' ? ArrowDown : ArrowUp;
  const StatusIcon = active ? CheckCircle : enabled ? Clock : AlertTriangle;
  
  return (
    <div className={`p-3 rounded-lg border ${
      active 
        ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
        : enabled 
          ? 'border-border bg-muted/30' 
          : 'border-dashed border-muted-foreground/30 bg-muted/10'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${
          active ? 'text-green-600' : enabled ? 'text-primary' : 'text-muted-foreground'
        }`} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusIcon className={`h-3 w-3 ${
          active ? 'text-green-600' : enabled ? 'text-muted-foreground' : 'text-muted-foreground/50'
        }`} />
        <span className="text-xs text-muted-foreground">
          {active ? 'Active' : enabled ? 'Enabled' : 'Coming Soon'}
        </span>
      </div>
      {lastSync && (
        <p className="text-xs text-muted-foreground mt-1">
          Last: {lastSync}
        </p>
      )}
      {count !== undefined && count > 0 && (
        <p className="text-xs font-medium mt-1">
          {count} synced
        </p>
      )}
    </div>
  );
}

interface PMSSyncStatusPanelProps {
  provider: PMSProviderConfig | null;
  isConnected: boolean;
  lastSyncAt?: string | null;
  propertyCount?: number;
}

export function PMSSyncStatusPanel({
  provider,
  isConnected,
  lastSyncAt,
  propertyCount,
}: PMSSyncStatusPanelProps) {
  if (!provider) {
    return null;
  }

  const formatLastSync = (date?: string | null) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString();
    } catch {
      return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Sync Capabilities
          {isConnected && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-900/30 dark:text-green-400">
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SyncCapabilityCard
            direction="pull"
            label="Properties"
            enabled={provider.capabilities.pullProperties}
            active={isConnected && provider.capabilities.pullProperties}
            count={propertyCount}
          />
          <SyncCapabilityCard
            direction="pull"
            label="Availability (iCal)"
            enabled={true}
            active={isConnected}
            lastSync={formatLastSync(lastSyncAt)}
          />
          <SyncCapabilityCard
            direction="push"
            label="Bookings"
            enabled={provider.capabilities.pushBookings}
            active={isConnected && provider.capabilities.pushBookings}
          />
        </div>

        {/* Sync direction visualization */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between gap-4 text-sm">
            <div className="text-center flex-1">
              <div className="font-medium mb-1">Your System</div>
              <div className="text-xs text-muted-foreground">
                Properties, Availability (iCal), Bookings
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-1 px-4">
              <div className="flex items-center gap-1 text-xs">
                <ArrowDown className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">PULL (iCal)</span>
              </div>
              <div className="h-px w-16 bg-border" />
              <div className="flex items-center gap-1 text-xs">
                <ArrowUp className="h-3 w-3 text-blue-600" />
                <span className="text-muted-foreground">PUSH</span>
              </div>
            </div>
            
            <div className="text-center flex-1">
              <div className="font-medium mb-1">{provider.name}</div>
              <div className="text-xs text-muted-foreground">
                External PMS + iCal Feeds
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
