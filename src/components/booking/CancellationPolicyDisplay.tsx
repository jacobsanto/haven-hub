import { useMemo } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  CancellationPolicyKey, 
  CANCELLATION_POLICIES, 
  getPolicySummary, 
  getPolicyBadgeClass 
} from '@/lib/cancellation-policies';
import { cn } from '@/lib/utils';

interface CancellationPolicyDisplayProps {
  policyKey: CancellationPolicyKey;
  checkInDate: Date;
  compact?: boolean;
  className?: string;
}

export function CancellationPolicyDisplay({
  policyKey,
  checkInDate,
  compact = false,
  className,
}: CancellationPolicyDisplayProps) {
  const policy = CANCELLATION_POLICIES[policyKey];
  const summaryLines = useMemo(() => getPolicySummary(policyKey, checkInDate), [policyKey, checkInDate]);

  const iconMap = {
    flexible: <CheckCircle className="h-4 w-4 text-green-600" />,
    moderate: <Clock className="h-4 w-4 text-amber-600" />,
    strict: <AlertCircle className="h-4 w-4 text-orange-600" />,
    non_refundable: <XCircle className="h-4 w-4 text-red-600" />,
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {iconMap[policyKey]}
        <span className="text-sm">{policy.shortDescription}</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border p-4 bg-card', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {iconMap[policyKey]}
          <h4 className="font-medium">Cancellation Policy</h4>
        </div>
        <Badge className={getPolicyBadgeClass(policyKey)}>
          {policy.label}
        </Badge>
      </div>

      <ul className="space-y-2">
        {summaryLines.map((line, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-primary mt-1">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
        Check-in: {checkInDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </p>
    </div>
  );
}
