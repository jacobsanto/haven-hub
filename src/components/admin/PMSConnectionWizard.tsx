import { useState, useEffect } from "react";
import {
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Plus,
} from "lucide-react";
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
import { useEnsurePMSConnection } from "@/hooks/useAdminPMSHealth";
import { usePMSProviders, useSaveCustomProvider, type DBProviderRecord } from "@/hooks/usePMSProviders";
import type { PMSProviderConfig, AuthFieldConfig } from "@/lib/pms-providers";
import { PMSProviderSelector } from "./PMSProviderSelector";
import { PMSCredentialsForm } from "./PMSCredentialsForm";
import { PMSSetupGuide } from "./PMSSetupGuide";
import { PMSCustomProviderForm } from "./PMSCustomProviderForm";
import type { AISuggestion } from "@/hooks/useAIPMSSetup";
import { supabase } from "@/integrations/supabase/client";

type WizardStep = "choose" | "setup" | "credentials" | "activate";

interface PMSConnectionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionEstablished?: (connectionId: string) => void;
}

export function PMSConnectionWizard({
  open,
  onOpenChange,
  onConnectionEstablished,
}: PMSConnectionWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<WizardStep>("choose");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customConfig, setCustomConfig] = useState<(AISuggestion & { name: string; docsUrl: string }) | null>(null);
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);

  const { data: providersData, isLoading: providersLoading } = usePMSProviders();
  const ensureConnection = useEnsurePMSConnection();
  const saveCustomProvider = useSaveCustomProvider();

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pms-webhook`;

  // Get the selected provider config
  const selectedRecord: DBProviderRecord | undefined = providersData?.records.find(
    (r) => r.slug === selectedProviderId
  );
  const selectedProvider: PMSProviderConfig | undefined = providersData?.providers.find(
    (p) => p.id === selectedProviderId
  );

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("choose");
      setSelectedProviderId(null);
      setIsCustom(false);
      setCustomConfig(null);
      setCredentialValues({});
      setTestResult(null);
    }
  }, [open]);

  const activeProvider: PMSProviderConfig | null = isCustom && customConfig
    ? {
        id: customConfig.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: customConfig.name,
        description: "",
        docsUrl: customConfig.docsUrl,
        edgeFunctionName: "pms-generic-test",
        authFields: customConfig.authFields.map((f) => ({
          ...f,
          secretName: f.key.toUpperCase(),
        })),
        capabilities: {
          pullProperties: customConfig.capabilities.pullProperties ?? false,
          pullAvailability: customConfig.capabilities.pullAvailability ?? false,
          pullRates: customConfig.capabilities.pullRates ?? false,
          pushBookings: customConfig.capabilities.pushBookings ?? false,
          webhooksSupported: customConfig.capabilities.webhooksSupported ?? false,
        },
      }
    : selectedProvider || null;

  const setupSteps = isCustom
    ? customConfig?.setupSteps || []
    : (selectedRecord?.setup_steps || []);

  const handleNext = () => {
    switch (step) {
      case "choose":
        if (isCustom) {
          setStep("setup");
        } else if (selectedProviderId) {
          setStep(setupSteps.length > 0 ? "setup" : "credentials");
        }
        break;
      case "setup":
        setStep("credentials");
        break;
      case "credentials":
        setStep("activate");
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "setup":
        setStep("choose");
        break;
      case "credentials":
        setStep(setupSteps.length > 0 || isCustom ? "setup" : "choose");
        break;
      case "activate":
        setStep("credentials");
        break;
    }
  };

  const handleCustomConfigReady = async (config: AISuggestion & { name: string; docsUrl: string }) => {
    setCustomConfig(config);

    // Save to DB registry
    try {
      const slug = config.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await saveCustomProvider.mutateAsync({
        slug,
        name: config.name,
        apiDocsUrl: config.docsUrl,
        authType: config.authType,
        authFields: config.authFields.map((f) => ({
          ...f,
          secretName: f.key.toUpperCase(),
        })),
        baseUrl: config.baseUrl,
        tokenUrl: config.tokenUrl,
        tokenScope: config.tokenScope,
        setupSteps: config.setupSteps,
        capabilities: config.capabilities as Record<string, boolean>,
      });
      setSelectedProviderId(slug);
      setStep("credentials");
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save provider",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    if (!activeProvider) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const record = selectedRecord || (customConfig ? {
        base_url: customConfig.baseUrl,
        auth_type: customConfig.authType,
        token_url: customConfig.tokenUrl,
        token_scope: customConfig.tokenScope,
      } : null);

      if (!record) throw new Error("No provider configuration found");

      // For built-in providers with edge functions, use the dedicated function
      if (selectedRecord?.edge_function_name && selectedRecord.edge_function_name !== 'pms-generic-test') {
        const response = await supabase.functions.invoke(selectedRecord.edge_function_name, {
          body: { action: 'test' },
        });
        const success = response.data?.success ?? false;
        setTestResult(success ? "success" : "failed");
        toast({
          title: success ? "Connection Successful" : "Connection Failed",
          description: success
            ? `Successfully connected to ${activeProvider.name}.`
            : response.data?.message || "Unable to connect. Check your credentials.",
          variant: success ? "default" : "destructive",
        });
      } else {
        // Use generic tester
        const response = await supabase.functions.invoke('pms-generic-test', {
          body: {
            authType: (record as DBProviderRecord).auth_type || customConfig?.authType,
            baseUrl: (record as DBProviderRecord).base_url || customConfig?.baseUrl,
            tokenUrl: (record as DBProviderRecord).token_url || customConfig?.tokenUrl,
            tokenScope: (record as DBProviderRecord).token_scope || customConfig?.tokenScope,
            credentials: credentialValues,
          },
        });
        const success = response.data?.success ?? false;
        setTestResult(success ? "success" : "failed");
        toast({
          title: success ? "Connection Successful" : "Connection Failed",
          description: success
            ? `Successfully connected to ${activeProvider.name}.`
            : response.data?.message || "Unable to connect. Check your credentials.",
          variant: success ? "default" : "destructive",
        });
      }
    } catch (error) {
      setTestResult("failed");
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleActivate = async () => {
    if (!activeProvider) return;
    try {
      const connection = await ensureConnection.mutateAsync({
        providerId: activeProvider.id,
        providerName: activeProvider.name,
      });
      toast({
        title: "PMS Connection Activated",
        description: `${activeProvider.name} integration is now active.`,
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

  const isLoading = ensureConnection.isPending || saveCustomProvider.isPending;

  // Step indicators
  const steps: { key: WizardStep; label: string }[] = [
    { key: "choose", label: "Provider" },
    { key: "setup", label: "Setup Guide" },
    { key: "credentials", label: "Credentials" },
    { key: "activate", label: "Activate" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Add PMS Connection
          </DialogTitle>
          <DialogDescription>
            Connect to any Property Management System to sync properties, availability, and rates.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : steps.findIndex((x) => x.key === step) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {steps.findIndex((x) => x.key === step) > i ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">{s.label}</span>
              {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-6 py-2">
          {/* Step 1: Choose Provider */}
          {step === "choose" && (
            <div className="space-y-4">
              {providersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading providers...</div>
              ) : (
                <>
                  <PMSProviderSelector
                    providers={providersData?.providers || []}
                    selectedProviderId={isCustom ? null : selectedProviderId}
                    onSelect={(id) => {
                      setSelectedProviderId(id);
                      setIsCustom(false);
                    }}
                  />
                  <Separator />
                  <div
                    onClick={() => {
                      setIsCustom(true);
                      setSelectedProviderId(null);
                    }}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      isCustom
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-dashed border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="font-semibold">Custom PMS</span>
                      <p className="text-sm text-muted-foreground">
                        Connect any PMS by providing its API documentation URL
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Setup Guide or Custom Provider Form */}
          {step === "setup" && (
            <div className="space-y-4">
              {isCustom && !customConfig ? (
                <PMSCustomProviderForm
                  onConfigReady={handleCustomConfigReady}
                  disabled={isLoading}
                />
              ) : (
                <PMSSetupGuide
                  steps={setupSteps}
                  providerName={activeProvider?.name || "PMS"}
                />
              )}
            </div>
          )}

          {/* Step 3: Credentials */}
          {step === "credentials" && activeProvider && (
            <div className="space-y-4">
              <PMSCredentialsForm
                provider={activeProvider}
                values={credentialValues}
                onChange={(key, value) =>
                  setCredentialValues((prev) => ({ ...prev, [key]: value }))
                }
                disabled={isLoading}
              />

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label>Webhook URL (for real-time updates)</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyWebhook}>
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
            </div>
          )}

          {/* Step 4: Test & Activate */}
          {step === "activate" && activeProvider && (
            <div className="space-y-4">
              {/* Connection test */}
              <div className="space-y-3">
                <h4 className="font-medium">Test Connection</h4>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting || isLoading}
                  >
                    {isTesting ? (
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

              <Separator />

              {/* Provider capabilities */}
              <div className="space-y-2">
                <h4 className="font-medium">Sync Capabilities</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {activeProvider.capabilities.pullProperties && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Import properties from {activeProvider.name}
                    </li>
                  )}
                  {activeProvider.capabilities.pullAvailability && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Sync availability calendar
                    </li>
                  )}
                  {activeProvider.capabilities.pullRates && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Sync nightly rates
                    </li>
                  )}
                  {activeProvider.capabilities.pushBookings ? (
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

              {!selectedRecord?.is_builtin && !selectedRecord?.edge_function_name && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> Custom providers currently support connection testing and iCal-based availability sync. Full property import requires a dedicated adapter.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <div>
            {step !== "choose" && (
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === "activate" ? (
              <Button onClick={handleActivate} disabled={isLoading}>
                {ensureConnection.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Activate Integration
              </Button>
            ) : step === "choose" && isCustom ? (
              <Button onClick={handleNext}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Set Up Custom Provider
              </Button>
            ) : step !== "setup" || !isCustom || customConfig ? (
              <Button
                onClick={handleNext}
                disabled={
                  (step === "choose" && !selectedProviderId && !isCustom) ||
                  isLoading
                }
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Next
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
