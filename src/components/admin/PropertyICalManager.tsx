import { useState } from "react";
import { Calendar, CheckCircle, XCircle, Loader2, Link as LinkIcon, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PropertyMapping {
  id: string;
  property_id: string;
  external_property_id: string;
  external_property_name: string | null;
  ical_url: string | null;
  last_ical_sync_at: string | null;
  property?: {
    name: string;
  };
}

interface PropertyICalManagerProps {
  mapping: PropertyMapping;
  onUpdate: () => void;
}

interface TestResult {
  success: boolean;
  events?: number;
  blockedDays?: number;
  sampleEvents?: Array<{ summary: string; checkIn: string; checkOut: string }>;
  error?: string;
}

export function PropertyICalManager({ mapping, onUpdate }: PropertyICalManagerProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [icalUrl, setIcalUrl] = useState(mapping.ical_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("pms_property_map")
        .update({ ical_url: icalUrl || null })
        .eq("id", mapping.id);

      if (error) throw error;

      toast({
        title: "iCal URL Updated",
        description: "The iCal feed URL has been saved.",
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update iCal URL",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!icalUrl) {
      toast({
        title: "No URL",
        description: "Please enter an iCal URL first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setShowTestDialog(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pms-sync-cron`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "test-ical",
            icalUrl,
          }),
        }
      );

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast({
          title: "iCal Feed Valid",
          description: `Found ${result.events} events with ${result.blockedDays} blocked days`,
        });
      } else {
        toast({
          title: "iCal Test Failed",
          description: result.error || "Could not parse iCal feed",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
      };
      setTestResult(errorResult);
      toast({
        title: "Test Failed",
        description: errorResult.error,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncNow = async () => {
    if (!mapping.ical_url) {
      toast({
        title: "No iCal URL",
        description: "Please configure an iCal URL first",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pms-sync-cron`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "sync-property",
            propertyId: mapping.property_id,
            triggerType: "manual",
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Synced ${result.blockedDays || 0} blocked days from ${result.events || 0} events`,
        });
        onUpdate();
      } else {
        throw new Error(result.error || "Sync failed");
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const propertyName = mapping.property?.name || mapping.external_property_name || "Property";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">iCal Feed</span>
        {mapping.ical_url ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Not Set
          </Badge>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Input
            placeholder="https://calendars.tokeet.com/calendar/rental/..."
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleTest} disabled={isTesting || !icalUrl}>
              {isTesting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-1" />}
              Test
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {mapping.ical_url && (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[300px]" title={mapping.ical_url}>
                {mapping.ical_url.length > 50 
                  ? `${mapping.ical_url.substring(0, 50)}...` 
                  : mapping.ical_url}
              </code>
              <a href={mapping.ical_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
          )}
          
          {mapping.last_ical_sync_at && (
            <p className="text-xs text-muted-foreground">
              Last sync: {format(new Date(mapping.last_ical_sync_at), "MMM d, HH:mm")}
            </p>
          )}
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              {mapping.ical_url ? "Edit URL" : "Add iCal URL"}
            </Button>
            {mapping.ical_url && (
              <Button size="sm" variant="ghost" onClick={handleSyncNow} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Sync Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Test Results Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              iCal Feed Test: {propertyName}
            </DialogTitle>
            <DialogDescription>
              Testing the iCal feed to verify it can be parsed correctly.
            </DialogDescription>
          </DialogHeader>

          {isTesting ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Fetching and parsing iCal feed...</p>
            </div>
          ) : testResult ? (
            <div className="space-y-4">
              {testResult.success ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Feed is valid</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-2xl font-bold">{testResult.events}</p>
                      <p className="text-sm text-muted-foreground">Events found</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-2xl font-bold">{testResult.blockedDays}</p>
                      <p className="text-sm text-muted-foreground">Blocked days</p>
                    </div>
                  </div>

                  {testResult.sampleEvents && testResult.sampleEvents.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Sample Events:</h4>
                      <div className="space-y-2">
                        {testResult.sampleEvents.map((event, i) => (
                          <div key={i} className="text-sm bg-muted/50 rounded p-2">
                            <span className="font-medium">{event.summary}</span>
                            <span className="text-muted-foreground ml-2">
                              {event.checkIn} → {event.checkOut}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>{testResult.error || "Failed to parse iCal feed"}</span>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
