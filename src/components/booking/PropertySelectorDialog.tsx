import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Users, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProperties } from '@/hooks/useProperties';
import { cn } from '@/lib/utils';

interface PropertySelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertySelectorDialog({ open, onOpenChange }: PropertySelectorDialogProps) {
  const navigate = useNavigate();
  const { data: properties, isLoading } = useProperties();
  const [selectedPropertySlug, setSelectedPropertySlug] = useState<string | null>(null);

  const handleSelectProperty = (slug: string) => {
    setSelectedPropertySlug(slug);
  };

  const handleProceed = () => {
    if (selectedPropertySlug) {
      onOpenChange(false);
      navigate(`/checkout?property=${selectedPropertySlug}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Choose Your Property</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-3">
                {properties?.map((property) => (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => handleSelectProperty(property.slug)}
                    className={cn(
                      'w-full flex gap-4 p-3 rounded-xl border-2 transition-all text-left',
                      selectedPropertySlug === property.slug
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {property.hero_image_url ? (
                      <img
                        src={property.hero_image_url}
                        alt={property.name}
                        className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-20 bg-muted rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-medium truncate">{property.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{property.city}, {property.country}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{property.bedrooms} bed</span>
                        <span>•</span>
                        <span>{property.bathrooms} bath</span>
                        <span>•</span>
                        <span>Up to {property.max_guests} guests</span>
                      </div>
                      <div className="mt-2 text-sm font-medium text-primary">
                        From €{property.base_price}/night
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleProceed}
                disabled={!selectedPropertySlug}
              >
                Continue to Book
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
