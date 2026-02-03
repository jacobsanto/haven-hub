import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { 
  FlaskConical, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTestWebhookEndpoint, PMSPropertyMapping } from '@/hooks/useAdminPMSHealth';
import { useQueryClient } from '@tanstack/react-query';

interface WebhookTesterCardProps {
  propertyMappings: PMSPropertyMapping[] | undefined;
  isLoading: boolean;
}

interface TestResult {
  success: boolean;
  status: number;
  statusText: string;
  response: Record<string, unknown>;
  testedEvent: string;
  timestamp: string;
}

export function WebhookTesterCard({ propertyMappings, isLoading }: WebhookTesterCardProps) {
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [testingEvent, setTestingEvent] = useState<string | null>(null);

  const testWebhook = useTestWebhookEndpoint();

  const selectedMapping = propertyMappings?.find(m => m.external_property_id === selectedPropertyId);

  const handleTest = async (eventType: 'booking.created' | 'booking.cancelled' | 'reconciliation.daily') => {
    setTestingEvent(eventType);
    setLastResult(null);

    try {
      let data: Record<string, unknown>;
      
      if (eventType === 'booking.created') {
        const tomorrow = addDays(new Date(), 1);
        const checkOut = addDays(tomorrow, 3);
        
        data = {
          pkey: `test-${Date.now()}`,
          rental_id: selectedPropertyId,
          check_in: format(tomorrow, 'yyyy-MM-dd'),
          check_out: format(checkOut, 'yyyy-MM-dd'),
          guest: { 
            name: 'Test Guest', 
            email: 'test@example.com',
            phone: '+1234567890',
          },
          num_adults: 2,
          num_child: 0,
          total: 500,
          currency: 'EUR',
          source: 'Test',
          channel: 'Webhook Tester',
        };
      } else if (eventType === 'booking.cancelled') {
        // For cancellation, we need an existing booking's external ID
        // Use a test ID that won't match anything real
        data = {
          pkey: `test-cancel-${Date.now()}`,
        };
      } else {
        // Reconciliation
        data = {};
      }

      const result = await testWebhook.mutateAsync({
        event: eventType,
        data,
      });

      setLastResult(result);

      // Refresh webhook events after test
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms', 'raw-events'] });

    } catch (error) {
      setLastResult({
        success: false,
        status: 0,
        statusText: 'Error',
        response: { error: error instanceof Error ? error.message : 'Unknown error' },
        testedEvent: eventType,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTestingEvent(null);
    }
  };

  const hasPropertySelected = !!selectedPropertyId;
  const mappingsAvailable = propertyMappings && propertyMappings.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Webhook Endpoint Tester
        </CardTitle>
        <CardDescription>
          Test your PMS webhook endpoints to verify they are working correctly before going live.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Property</label>
          {isLoading ? (
            <div className="h-10 bg-muted animate-pulse rounded" />
          ) : mappingsAvailable ? (
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a mapped property..." />
              </SelectTrigger>
              <SelectContent>
                {propertyMappings.map((mapping) => (
                  <SelectItem key={mapping.id} value={mapping.external_property_id}>
                    {mapping.property?.name || mapping.external_property_name || mapping.external_property_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No property mappings found. Import properties from your PMS first.
              </AlertDescription>
            </Alert>
          )}
          {selectedMapping && (
            <p className="text-xs text-muted-foreground">
              External ID: <code className="bg-muted px-1 rounded">{selectedMapping.external_property_id}</code>
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleTest('booking.created')}
            disabled={!hasPropertySelected || testingEvent !== null}
            variant="outline"
            size="sm"
          >
            {testingEvent === 'booking.created' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Booking Created
          </Button>

          <Button
            onClick={() => handleTest('booking.cancelled')}
            disabled={!hasPropertySelected || testingEvent !== null}
            variant="outline"
            size="sm"
          >
            {testingEvent === 'booking.cancelled' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Cancellation
          </Button>

          <Button
            onClick={() => handleTest('reconciliation.daily')}
            disabled={testingEvent !== null}
            variant="outline"
            size="sm"
          >
            {testingEvent === 'reconciliation.daily' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Reconciliation
          </Button>
        </div>

        {/* Test Result */}
        {lastResult && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              {lastResult.success && lastResult.status >= 200 && lastResult.status < 300 ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">
                {lastResult.testedEvent}
              </span>
              <Badge variant={lastResult.success ? 'default' : 'destructive'}>
                {lastResult.status} {lastResult.statusText}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Tested at {format(new Date(lastResult.timestamp), 'HH:mm:ss')}
            </div>

            <div className="bg-muted rounded p-3">
              <p className="text-xs font-medium mb-1">Response:</p>
              <pre className="text-xs overflow-auto max-h-32">
                {JSON.stringify(lastResult.response, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          Test bookings are created with <code className="bg-muted px-1 rounded">source: "Test"</code> and can be identified in the bookings table.
          Check the Webhook Events tab after testing to see the logged events.
        </p>
      </CardContent>
    </Card>
  );
}
