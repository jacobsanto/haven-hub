import { RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncStatusBadgeProps {
  lastSyncAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export function SyncStatusBadge({
  lastSyncAt,
  syncStatus,
  onSyncNow,
  isSyncing,
}: SyncStatusBadgeProps) {
  const getStatusIcon = () => {
    if (isSyncing || syncStatus === 'syncing') {
      return <RefreshCw className="h-3 w-3 animate-spin" />;
    }
    if (syncStatus === 'error') {
      return <AlertCircle className="h-3 w-3" />;
    }
    if (syncStatus === 'success') {
      return <Check className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (syncStatus === 'error') return 'destructive';
    if (syncStatus === 'success') return 'default';
    return 'secondary';
  };

  const getTimeAgo = () => {
    if (!lastSyncAt) return 'Never synced';
    return formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true });
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getStatusVariant()} className="gap-1 cursor-default">
              {getStatusIcon()}
              <span>{getTimeAgo()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {lastSyncAt 
              ? `Last synced: ${format(new Date(lastSyncAt), 'PPpp')}`
              : 'No sync history available'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {onSyncNow && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncNow}
          disabled={isSyncing}
          className="h-7"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      )}
    </div>
  );
}
