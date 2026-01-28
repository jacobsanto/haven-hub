import { useState } from "react";
import { Settings, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useTestAdvanceCMConnection,
  useEnsureAdvanceCMConnection,
} from "@/hooks/useAdvanceCMSync";

interface PMSConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionEstablished?: (connectionId: string) => void;
}

export function PMSConfigDialog({
  open,
  onOpenChange,
  onConnectionEstablished,
}: PMSConfigDialogProps) {
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(null);

  const testConnection = useTestAdvanceCMConnection();
  const ensureConnection = useEnsureAdvanceCMConnection();

  const handleTestConnection = async () => {
    setTestResult(null);
    try {
      const result = await testConnection.mutateAsync();
      setTestResult(result.success ? "success" : "failed");

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to AdvanceCM (Tokeet).",
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
        description: "AdvanceCM integration is now active.",
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

  const isLoading = testConnection.isPending || ensureConnection.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure AdvanceCM Integration
          </DialogTitle>
          <DialogDescription>
            Connect to your Tokeet / AdvanceCM account to sync properties and
            availability.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Credentials info */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-2">API Credentials</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Your Tokeet API credentials have been configured as secure secrets.
              You can update them in your project settings if needed.
            </p>
            <div className="flex gap-2">
              <a
                href="https://capi.tokeet.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Tokeet API Docs
              </a>
            </div>
          </div>

          {/* Connection test */}
          <div className="space-y-3">
            <h4 className="font-medium">Connection Status</h4>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isLoading}
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
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-medium">Available Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Import properties from Tokeet
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Sync availability calendar
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Sync nightly rates
              </li>
              <li className="flex items-center gap-2 text-muted-foreground/70">
                <span className="h-4 w-4 flex items-center justify-center text-xs">◌</span>
                Push bookings to PMS (coming soon)
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleActivate}
            disabled={isLoading || testResult !== "success"}
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
