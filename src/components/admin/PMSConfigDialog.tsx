import { useState, useEffect } from "react";
import { Settings, CheckCircle, XCircle, Loader2, ExternalLink, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useTestAdvanceCMConnection,
  useEnsureAdvanceCMConnection,
} from "@/hooks/useAdvanceCMSync";
import { PMS_PROVIDERS, PMSProviderConfig, getProviderById } from "@/lib/pms-providers";
import { PMSProviderSelector } from "./PMSProviderSelector";
import { PMSCredentialsForm } from "./PMSCredentialsForm";

interface PMSConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionEstablished?: (connectionId: string) => void;
  currentProvider?: string | null;
}

export function PMSConfigDialog({
  open,
  onOpenChange,
  onConnectionEstablished,
  currentProvider,
}: PMSConfigDialogProps) {
  const { toast } = useToast();
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    currentProvider || 'advancecm'
  );
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(null);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});

  const testConnection = useTestAdvanceCMConnection();
  const ensureConnection = useEnsureAdvanceCMConnection();

  const selectedProvider = selectedProviderId 
    ? getProviderById(selectedProviderId) 
    : null;

  // Generate webhook URL
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pms-webhook`;

  // Reset test result when provider changes
  useEffect(() => {
    setTestResult(null);
    setCredentialValues({});
  }, [selectedProviderId]);

  const handleTestConnection = async () => {
    setTestResult(null);
    try {
      const result = await testConnection.mutateAsync();
      setTestResult(result.success ? "success" : "failed");

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Successfully connected to ${selectedProvider?.name || 'PMS'}.`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect. Please check your API credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestResult("failed");
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async () => {
    try {
      const connection = await ensureConnection.mutateAsync();
      toast({
        title: "PMS Connection Activated",
        description: `${selectedProvider?.name || 'PMS'} integration is now active.`,
      });
      onConnectionEstablished?.(connection.id);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Activation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentialValues((prev) => ({ ...prev, [key]: value }));
  };

  const isLoading = testConnection.isPending || ensureConnection.isPending;
  const isAdvanceCM = selectedProviderId === 'advancecm';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure PMS Integration
          </DialogTitle>
          <DialogDescription>
            Connect to your Property Management System to sync properties, availability, and rates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection */}
          <PMSProviderSelector
            providers={PMS_PROVIDERS}
            selectedProviderId={selectedProviderId}
            onSelect={setSelectedProviderId}
            currentActiveProvider={currentProvider}
          />

          <Separator />

          {/* Provider-specific configuration */}
          {selectedProvider && (
            <>
              {/* Credentials info for AdvanceCM */}
              {isAdvanceCM ? (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">API Credentials</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your Tokeet API credentials have been configured as secure secrets.
                    You can update them in your project settings if needed.
                  </p>
                  <a
                    href={selectedProvider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View API Documentation
                  </a>
                </div>
              ) : (
                <PMSCredentialsForm
                  provider={selectedProvider}
                  values={credentialValues}
                  onChange={handleCredentialChange}
                  disabled={isLoading}
                />
              )}

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label>Webhook URL (for real-time updates)</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyWebhook}
                  >
                    {webhookCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure this URL in your PMS for real-time availability updates.
                </p>
              </div>

              {/* Connection test */}
              <div className="space-y-3">
                <h4 className="font-medium">Connection Status</h4>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isLoading || !isAdvanceCM}
                  >
                    {testConnection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : testResult === "success" ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ) : testResult === "failed" ? (
                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    ) : null}
                    Test Connection
                  </Button>
                  {testResult === "success" && (
                    <span className="text-sm text-green-600">Connected successfully!</span>
                  )}
                  {testResult === "failed" && (
                    <span className="text-sm text-red-600">Connection failed</span>
                  )}
                  {!isAdvanceCM && (
                    <span className="text-sm text-muted-foreground">
                      Coming soon - save credentials first
                    </span>
                  )}
                </div>
              </div>

              {/* Provider capabilities */}
              <div className="space-y-2">
                <h4 className="font-medium">Sync Capabilities</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selectedProvider.capabilities.pullProperties && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Import properties from {selectedProvider.name}
                    </li>
                  )}
                  {selectedProvider.capabilities.pullAvailability && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Sync availability calendar
                    </li>
                  )}
                  {selectedProvider.capabilities.pullRates && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Sync nightly rates
                    </li>
                  )}
                  {selectedProvider.capabilities.pushBookings ? (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Push bookings to PMS
                    </li>
                  ) : (
                    <li className="flex items-center gap-2 text-muted-foreground/70">
                      <span className="h-4 w-4 flex items-center justify-center text-xs">◌</span>
                      Push bookings to PMS (coming soon)
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleActivate}
            disabled={isLoading || (isAdvanceCM && testResult !== "success")}
          >
            {ensureConnection.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Activate Integration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
