import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGuestyQuota } from '@/hooks/useGuestyQuota';

export function GuestyQuotaMonitor() {
  const { data: quota, isLoading } = useGuestyQuota();

  if (isLoading || !quota) {
    return null;
  }

  const usagePercent = (quota.used / quota.max) * 100;

  const statusConfig = {
    ok: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-800',
      progressColor: '',
      label: 'Healthy',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      progressColor: '[&>div]:bg-yellow-500',
      label: 'Low Quota',
    },
    exhausted: {
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/5',
      borderColor: 'border-destructive/30',
      progressColor: '[&>div]:bg-destructive',
      label: 'Exhausted',
    },
    unknown: {
      icon: HelpCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      borderColor: 'border-border',
      progressColor: '',
      label: 'Unknown',
    },
  };

  const config = statusConfig[quota.status];
  const StatusIcon = config.icon;

  return (
    <Card className={`${config.borderColor} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Guesty API Quota</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`${config.color} ${config.bgColor} border-0`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <CardDescription>
          Token requests: {quota.max} allowed per 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {quota.used} of {quota.max} used
            </span>
            <span className={`font-medium ${config.color}`}>
              {quota.remaining} remaining
            </span>
          </div>
          <Progress
            value={usagePercent}
            className={`h-2 ${config.progressColor}`}
          />
        </div>

        {/* Next reset */}
        {quota.nextResetAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Next token available{' '}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-foreground cursor-help underline decoration-dotted">
                      {formatDistanceToNow(new Date(quota.nextResetAt), { addSuffix: true })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(new Date(quota.nextResetAt), 'PPpp')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
          </div>
        )}

        {/* Warning message */}
        {quota.status === 'exhausted' && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Token quota exhausted</p>
              <p className="mt-1 opacity-80">
                All {quota.max} Guesty API token requests have been used in the
                last 24 hours. Connection tests, property imports, and syncs
                will fail until the quota resets.
              </p>
            </div>
          </div>
        )}

        {quota.status === 'warning' && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 p-3 text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Low quota warning</p>
              <p className="mt-1 opacity-80">
                Only {quota.remaining} token request remaining. Avoid
                unnecessary connection tests to preserve quota.
              </p>
            </div>
          </div>
        )}

        {/* Recent requests log */}
        {quota.recentRequests.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent Token Requests (24h)
            </p>
            <div className="space-y-1">
              {quota.recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {req.success ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span className="text-muted-foreground">
                      {format(new Date(req.requested_at), 'HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.response_status && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {req.response_status}
                      </Badge>
                    )}
                    {req.error_message && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">{req.error_message}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
