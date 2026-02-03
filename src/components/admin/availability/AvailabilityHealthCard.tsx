import { Calendar, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface AvailabilityHealthCardProps {
  totalProperties: number;
  propertiesWithSync: number;
  propertiesWithErrors: number;
  lastSyncTime: string | null;
}

export function AvailabilityHealthCard({
  totalProperties,
  propertiesWithSync,
  propertiesWithErrors,
  lastSyncTime,
}: AvailabilityHealthCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="card-organic">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Properties</p>
              <p className="text-2xl font-medium">{totalProperties}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-organic">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PMS Synced</p>
              <p className="text-2xl font-medium">{propertiesWithSync}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-organic">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sync Errors</p>
              <p className="text-2xl font-medium">{propertiesWithErrors}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-organic">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium">
                {lastSyncTime 
                  ? format(new Date(lastSyncTime), 'MMM d, h:mm a')
                  : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
