import { useState } from "react";
import { Loader2, Sparkles, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAnalyzePMSDocs, type AISuggestion } from "@/hooks/useAIPMSSetup";
import { PMSSetupGuide } from "./PMSSetupGuide";

interface PMSCustomProviderFormProps {
  onConfigReady: (config: AISuggestion & { name: string; docsUrl: string }) => void;
  disabled?: boolean;
}

export function PMSCustomProviderForm({ onConfigReady, disabled }: PMSCustomProviderFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields from AI suggestion
  const [authType, setAuthType] = useState<string>("api_key");
  const [baseUrl, setBaseUrl] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [tokenScope, setTokenScope] = useState("");
  const [authFields, setAuthFields] = useState<AISuggestion["authFields"]>([]);
  const [setupSteps, setSetupSteps] = useState<AISuggestion["setupSteps"]>([]);
  const [capabilities, setCapabilities] = useState<AISuggestion["capabilities"]>({});

  const analyzeDocs = useAnalyzePMSDocs();

  const handleAnalyze = async () => {
    if (!docsUrl) {
      toast({ title: "URL Required", description: "Please enter an API documentation URL.", variant: "destructive" });
      return;
    }

    try {
      const result = await analyzeDocs.mutateAsync({ docsUrl, providerName: name });
      setSuggestion(result);
      setAuthType(result.authType);
      setBaseUrl(result.baseUrl || "");
      setTokenUrl(result.tokenUrl || "");
      setTokenScope(result.tokenScope || "");
      setAuthFields(result.authFields || []);
      setSetupSteps(result.setupSteps || []);
      setCapabilities(result.capabilities || {});
      setIsEditing(false);

      toast({
        title: "AI Analysis Complete",
        description: "Review the suggested configuration below. Adjust anything that doesn't look right.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze the documentation",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = () => {
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter a provider name.", variant: "destructive" });
      return;
    }

    onConfigReady({
      name: name.trim(),
      docsUrl,
      authType: authType as AISuggestion["authType"],
      authFields,
      baseUrl,
      tokenUrl: tokenUrl || undefined,
      tokenScope: tokenScope || undefined,
      setupSteps,
      capabilities,
    });
  };

  const addAuthField = () => {
    setAuthFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: "", type: "text" as const, required: true },
    ]);
  };

  const removeAuthField = (index: number) => {
    setAuthFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAuthField = (index: number, updates: Partial<AISuggestion["authFields"][0]>) => {
    setAuthFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  return (
    <div className="space-y-4">
      {/* Provider Name & Docs URL */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="provider-name">Provider Name *</Label>
          <Input
            id="provider-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lodgify, Beds24, Hospitable"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="docs-url">API Documentation URL *</Label>
          <div className="flex gap-2">
            <Input
              id="docs-url"
              value={docsUrl}
              onChange={(e) => setDocsUrl(e.target.value)}
              placeholder="https://docs.example.com/api"
              type="url"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAnalyze}
              disabled={disabled || analyzeDocs.isPending || !docsUrl}
            >
              {analyzeDocs.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Analyze</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste the API documentation URL and click Analyze. AI will suggest the configuration needed.
          </p>
        </div>
      </div>

      {/* AI Suggestion Result */}
      {suggestion && (
        <>
          <Separator />

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>AI Suggestion</strong> — Review and adjust the configuration below before proceeding. AI output is advisory only.
            </p>
          </div>

          {/* Setup Steps */}
          {setupSteps.length > 0 && (
            <PMSSetupGuide steps={setupSteps} providerName={name || "this provider"} />
          )}

          <Separator />

          {/* Editable Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Connection Configuration</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Done Editing" : "Edit"}
              </Button>
            </div>

            {/* Auth Type */}
            <div className="space-y-2">
              <Label>Authentication Type</Label>
              {isEditing ? (
                <Select value={authType} onValueChange={setAuthType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="oauth2_client_credentials">OAuth2 Client Credentials</SelectItem>
                    <SelectItem value="bearer_token">Bearer Token</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary">{authType.replace(/_/g, " ")}</Badge>
              )}
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <Label>Base URL</Label>
              {isEditing ? (
                <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              ) : (
                <p className="text-sm font-mono text-muted-foreground">{baseUrl || "Not set"}</p>
              )}
            </div>

            {/* Token URL (OAuth2 only) */}
            {authType === "oauth2_client_credentials" && (
              <>
                <div className="space-y-2">
                  <Label>Token URL</Label>
                  {isEditing ? (
                    <Input value={tokenUrl} onChange={(e) => setTokenUrl(e.target.value)} />
                  ) : (
                    <p className="text-sm font-mono text-muted-foreground">{tokenUrl || "Not set"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>OAuth Scope</Label>
                  {isEditing ? (
                    <Input value={tokenScope} onChange={(e) => setTokenScope(e.target.value)} placeholder="Optional" />
                  ) : (
                    <p className="text-sm font-mono text-muted-foreground">{tokenScope || "None"}</p>
                  )}
                </div>
              </>
            )}

            {/* Auth Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Credential Fields</Label>
                {isEditing && (
                  <Button type="button" variant="ghost" size="sm" onClick={addAuthField}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Field
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {authFields.map((field, i) =>
                  isEditing ? (
                    <div key={i} className="flex gap-2 items-start p-2 rounded border">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={field.label}
                          onChange={(e) => updateAuthField(i, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                          placeholder="Field label"
                          className="text-sm"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(v) => updateAuthField(i, { type: v as "text" | "password" | "url" })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="password">Password</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeAuthField(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="font-mono text-xs">
                        {field.type === "password" ? "🔒" : "📝"} {field.label || field.key}
                      </Badge>
                      {field.required && <span className="text-destructive text-xs">required</span>}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-2">
              <Label>Capabilities</Label>
              <div className="flex flex-wrap gap-1.5">
                {capabilities.pullProperties && <Badge variant="secondary" className="text-xs">⬇ Properties</Badge>}
                {capabilities.pullAvailability && <Badge variant="secondary" className="text-xs">⬇ Availability</Badge>}
                {capabilities.pullRates && <Badge variant="secondary" className="text-xs">⬇ Rates</Badge>}
                {capabilities.pushBookings && <Badge variant="secondary" className="text-xs">⬆ Bookings</Badge>}
                {capabilities.webhooksSupported && <Badge variant="secondary" className="text-xs">🔔 Webhooks</Badge>}
              </div>
            </div>
          </div>

          <Separator />

          <Button onClick={handleConfirm} disabled={disabled || !name.trim()} className="w-full">
            Confirm Configuration
          </Button>
        </>
      )}
    </div>
  );
}
