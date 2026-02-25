import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

interface LiveAvailabilityBadgeProps {
  lastSyncAt?: string | null;
  isUpdating?: boolean;
  className?: string;
}

/**
 * Visual indicator showing that availability data is live and synced.
 * Shows a pulse animation and optional last sync timestamp.
 */
export function LiveAvailabilityBadge({
  lastSyncAt,
  isUpdating = false,
  className = '',
}: LiveAvailabilityBadgeProps) {
  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="relative flex items-center gap-1.5">
        <motion.div
          className={`h-2 w-2 rounded-full ${isUpdating ? 'bg-muted-foreground' : 'bg-primary'}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <Radio className={`h-3 w-3 ${isUpdating ? 'text-muted-foreground' : 'text-primary'}`} />
        <span className={`font-medium ${isUpdating ? 'text-muted-foreground' : 'text-primary'}`}>
          {isUpdating ? 'Updating...' : 'Live'}
        </span>
      </div>
      
      {lastSyncAt && !isUpdating && (
        <span className="text-muted-foreground">
          Synced {formatLastSync(lastSyncAt)}
        </span>
      )}
    </div>
  );
}
