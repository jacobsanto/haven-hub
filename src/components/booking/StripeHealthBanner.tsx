import { AlertCircle, Loader2, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStripeHealth, StripeHealthStatus } from '@/hooks/useStripeHealth';

interface StripeHealthBannerProps {
  onHealthy?: () => void;
  showWhenHealthy?: boolean;
}

export function StripeHealthBanner({ onHealthy, showWhenHealthy = false }: StripeHealthBannerProps) {
  const { status, isChecking, checkHealth, error, isHealthy, canProceed } = useStripeHealth();

  // Notify parent when healthy
  if (isHealthy && onHealthy) {
    onHealthy();
  }

  // Don't show anything if healthy and not explicitly requested
  if (isHealthy && !showWhenHealthy) {
    return null;
  }

  if (isChecking || status === 'checking') {
    return (
      <Alert className="bg-muted border-muted-foreground/20">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription className="flex items-center gap-2">
          Checking payment system availability...
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'healthy') {
    return (
      <Alert className="bg-muted/50 border-primary/20">
        <Shield className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          Payment system is ready
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'degraded') {
    return (
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="flex items-center justify-between text-muted-foreground">
          <span>Payment system is experiencing minor issues. You can still proceed.</span>
        </AlertDescription>
      </Alert>
    );
  }

  // Unhealthy state
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error || 'Payment system is temporarily unavailable'}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => checkHealth(true)}
          className="ml-4"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function usePreflightCheck() {
  const health = useStripeHealth();
  
  return {
    ...health,
    shouldBlockPayment: health.status === 'unhealthy',
    shouldWarnPayment: health.status === 'degraded',
  };
}
