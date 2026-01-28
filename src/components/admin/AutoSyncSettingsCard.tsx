import { useState, useEffect } from 'react';
import { Settings, Clock, Link2, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AutoSyncSettingsCardProps {
  connectionId: string | null;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  lastScheduledSync?: string | null;
  onUpdateSettings: (settings: { autoSyncEnabled?: boolean; syncIntervalMinutes?: number }) => Promise<void>;
  isUpdating: boolean;
  projectId: string;
}

const SYNC_INTERVALS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
];

export function AutoSyncSettingsCard({
  connectionId,
  autoSyncEnabled,
  syncIntervalMinutes,
  lastScheduledSync,
  onUpdateSettings,
  isUpdating,
  projectId,
}: AutoSyncSettingsCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/pms-webhook`;

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Webhook URL copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL manually.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    try {
      await onUpdateSettings({ autoSyncEnabled: enabled });
      toast({
        title: enabled ? 'Auto-sync enabled' : 'Auto-sync disabled',
        description: enabled
          ? `Availability will sync every ${syncIntervalMinutes} minutes.`
          : 'Automatic syncing has been turned off.',
      });
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleIntervalChange = async (value: string) => {
    const minutes = parseInt(value, 10);
    try {
      await onUpdateSettings({ syncIntervalMinutes: minutes });
      toast({
        title: 'Interval updated',
        description: `Sync interval set to ${minutes} minutes.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  if (!connectionId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Sync Settings
        </CardTitle>
        <CardDescription>
          Configure automatic availability synchronization and webhook integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Sync Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync" className="font-medium">
              Automatic Sync
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically pull availability from PMS on a schedule
            </p>
          </div>
          <div className="flex items-center gap-3">
            {autoSyncEnabled && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Every {syncIntervalMinutes}m
              </Badge>
            )}
            <Switch
              id="auto-sync"
              checked={autoSyncEnabled}
              onCheckedChange={handleToggleAutoSync}
              disabled={isUpdating}
            />
          </div>
        </div>

        {/* Sync Interval Selector */}
        {autoSyncEnabled && (
          <div className="space-y-2">
            <Label htmlFor="sync-interval">Sync Interval</Label>
            <Select
              value={syncIntervalMinutes.toString()}
              onValueChange={handleIntervalChange}
              disabled={isUpdating}
            >
              <SelectTrigger id="sync-interval" className="w-[180px]">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {SYNC_INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value.toString()}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lastScheduledSync && (
              <p className="text-xs text-muted-foreground">
                Last scheduled sync: {new Date(lastScheduledSync).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Webhook URL */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <Label>Webhook URL</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure this URL in your PMS (Tokeet) to receive real-time booking and availability updates.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono break-all">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyWebhookUrl}
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Subscribe to events: <code className="bg-muted px-1 rounded">booking.created</code>,{' '}
            <code className="bg-muted px-1 rounded">booking.cancelled</code>,{' '}
            <code className="bg-muted px-1 rounded">availability.updated</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
