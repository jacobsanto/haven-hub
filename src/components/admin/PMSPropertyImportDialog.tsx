import { useState, useEffect } from "react";
import { Check, X, Loader2, Download, MapPin, Users, BedDouble } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  useFetchTokeetProperties,
  useMappedPropertyIds,
  useBatchImportProperties,
} from "@/hooks/useAdvanceCMSync";
import type { TokeetProperty } from "@/integrations/pms/advancecm-adapter";

interface PMSPropertyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
}

export function PMSPropertyImportDialog({
  open,
  onOpenChange,
  connectionId,
}: PMSPropertyImportDialogProps) {
  const { toast } = useToast();
  const [properties, setProperties] = useState<TokeetProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importResults, setImportResults] = useState<
    Record<string, { success: boolean; error?: string }>
  >({});

  const fetchProperties = useFetchTokeetProperties();
  const { data: mappedIds = [] } = useMappedPropertyIds(connectionId);
  const batchImport = useBatchImportProperties();

  // Fetch properties when dialog opens
  useEffect(() => {
    if (open && properties.length === 0 && !fetchProperties.isPending) {
      fetchProperties.mutate(undefined, {
        onSuccess: (data) => {
          // Convert PMSProperty to TokeetProperty format
          setProperties(
            data.map((p) => ({
              externalId: p.externalId,
              name: p.name,
              description: p.description,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              maxGuests: p.maxGuests,
              city: p.location.city,
              region: p.location.region,
              country: p.location.country,
              propertyType: "villa",
              highlights: p.amenities,
              images: p.images,
              coordinates: p.location.coordinates,
            }))
          );
        },
        onError: (error) => {
          toast({
            title: "Failed to fetch properties",
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          });
        },
      });
    }
  }, [open, properties.length, fetchProperties, toast]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setImportResults({});
    }
  }, [open]);

  const unmappedProperties = properties.filter(
    (p) => !mappedIds.includes(p.externalId)
  );
  const mappedProperties = properties.filter((p) =>
    mappedIds.includes(p.externalId)
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(unmappedProperties.map((p) => p.externalId)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleImport = async () => {
    const selectedProperties = properties.filter((p) =>
      selectedIds.has(p.externalId)
    );

    batchImport.mutate(
      { properties: selectedProperties, connectionId },
      {
        onSuccess: (data) => {
          const results: Record<string, { success: boolean; error?: string }> = {};
          data.results.forEach((r) => {
            results[r.externalId] = { success: r.success, error: r.error };
          });
          setImportResults(results);

          toast({
            title: "Import Complete",
            description: `Successfully imported ${data.successCount} of ${data.totalCount} properties.`,
            variant: data.failedCount > 0 ? "default" : "default",
          });

          // Refresh properties list
          fetchProperties.mutate();
        },
        onError: (error) => {
          toast({
            title: "Import Failed",
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          });
        },
      }
    );
  };

  const isLoading = fetchProperties.isPending;
  const isImporting = batchImport.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Properties from AdvanceCM
          </DialogTitle>
          <DialogDescription>
            Select properties from your Tokeet account to import into your booking
            engine.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Fetching properties from Tokeet...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No properties found in your Tokeet account.</p>
          </div>
        ) : (
          <>
            {/* Selection controls */}
            {unmappedProperties.length > 0 && (
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} of {unmappedProperties.length} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3">
                {/* Unmapped properties (available for import) */}
                {unmappedProperties.map((property) => {
                  const result = importResults[property.externalId];
                  const isSelected = selectedIds.has(property.externalId);

                  return (
                    <div
                      key={property.externalId}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                        result?.success
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : result?.error
                          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                          : isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(property.externalId)}
                        disabled={!!result || isImporting}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{property.name}</span>
                          {result?.success && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <Check className="h-3 w-3 mr-1" />
                              Imported
                            </Badge>
                          )}
                          {result?.error && (
                            <Badge variant="destructive">
                              <X className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.city}, {property.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3" />
                            {property.bedrooms} bed
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {property.maxGuests} guests
                          </span>
                        </div>
                        {result?.error && (
                          <p className="text-sm text-red-600 mt-1">{result.error}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          → Will create as: <code className="bg-muted px-1 rounded">{property.name.toLowerCase().replace(/\s+/g, "-")}</code> (draft)
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Already mapped properties */}
                {mappedProperties.length > 0 && (
                  <>
                    <div className="pt-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        Already Linked ({mappedProperties.length})
                      </span>
                    </div>
                    {mappedProperties.map((property) => (
                      <div
                        key={property.externalId}
                        className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30 opacity-60"
                      >
                        <Check className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{property.name}</span>
                            <Badge variant="secondary">Linked</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.city}, {property.country}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {Object.keys(importResults).length > 0 ? "Close" : "Cancel"}
          </Button>
          {unmappedProperties.length > 0 && selectedIds.size > 0 && (
            <Button
              onClick={handleImport}
              disabled={isImporting || selectedIds.size === 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import {selectedIds.size} Properties
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
