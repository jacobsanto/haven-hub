import { CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PMSProviderConfig } from "@/lib/pms-providers";
import { Badge } from "@/components/ui/badge";

interface PMSProviderSelectorProps {
  providers: PMSProviderConfig[];
  selectedProviderId: string | null;
  onSelect: (providerId: string) => void;
  currentActiveProvider?: string | null;
}

export function PMSProviderSelector({
  providers,
  selectedProviderId,
  onSelect,
  currentActiveProvider,
}: PMSProviderSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Provider</label>
      <div className="space-y-2">
        {providers.map((provider) => {
          const isSelected = selectedProviderId === provider.id;
          const isActive = currentActiveProvider === provider.id;
          
          return (
            <div
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                isActive && !isSelected && "border-green-500/50 bg-green-50 dark:bg-green-900/10"
              )}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                )}
              </div>

              {/* Provider info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{provider.name}</span>
                  {isActive && (
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {provider.description}
                </p>
                
                {/* Capabilities */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {provider.capabilities.pullProperties && (
                    <Badge variant="secondary" className="text-xs">
                      ⬇ Properties
                    </Badge>
                  )}
                  {provider.capabilities.pullAvailability && (
                    <Badge variant="secondary" className="text-xs">
                      ⬇ Availability
                    </Badge>
                  )}
                  {provider.capabilities.pullRates && (
                    <Badge variant="secondary" className="text-xs">
                      ⬇ Rates
                    </Badge>
                  )}
                  {provider.capabilities.pushBookings && (
                    <Badge variant="secondary" className="text-xs">
                      ⬆ Bookings
                    </Badge>
                  )}
                  {!provider.capabilities.pushBookings && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      ⬆ Bookings (coming)
                    </Badge>
                  )}
                </div>

                {/* Docs link */}
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  API Documentation
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
