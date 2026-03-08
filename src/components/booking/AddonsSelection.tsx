import { useState } from 'react';
import { Addon, SelectedAddon } from '@/types/booking-engine';
import { useAddons, calculateAddonPrice } from '@/hooks/useBookingEngine';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Check, Car, UtensilsCrossed, Sparkles, HandHelping, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddonsSelectionProps {
  propertyId?: string;
  nights: number;
  guests: number;
  selectedAddons: SelectedAddon[];
  onAddonsChange: (addons: SelectedAddon[]) => void;
  className?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  transfer: Car,
  food: UtensilsCrossed,
  experience: Sparkles,
  service: HandHelping,
  package: Gift,
};

const categoryLabels: Record<string, string> = {
  transfer: 'Transfers',
  food: 'Dining',
  experience: 'Experiences',
  service: 'Services',
  package: 'Packages',
};

export function AddonsSelection({
  propertyId,
  nights,
  guests,
  selectedAddons,
  onAddonsChange,
  className,
}: AddonsSelectionProps) {
  const { data: addons, isLoading } = useAddons(propertyId);
  const { formatPrice } = useCurrency();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('transfer');

  const handleAddAddon = (addon: Addon) => {
    const existing = selectedAddons.find(s => s.addon.id === addon.id);
    
    if (existing) {
      // Increment quantity if not at max
      if (!addon.maxQuantity || existing.quantity < addon.maxQuantity) {
        const newQuantity = existing.quantity + 1;
        const calculatedPrice = calculateAddonPrice(addon, newQuantity, nights, guests);
        
        onAddonsChange(
          selectedAddons.map(s =>
            s.addon.id === addon.id
              ? { ...s, quantity: newQuantity, calculatedPrice }
              : s
          )
        );
      }
    } else {
      // Add new addon
      const calculatedPrice = calculateAddonPrice(addon, 1, nights, guests);
      onAddonsChange([
        ...selectedAddons,
        { addon, quantity: 1, calculatedPrice },
      ]);
    }
  };

  const handleRemoveAddon = (addonId: string) => {
    const existing = selectedAddons.find(s => s.addon.id === addonId);
    
    if (existing) {
      if (existing.quantity > 1) {
        // Decrement quantity
        const newQuantity = existing.quantity - 1;
        const calculatedPrice = calculateAddonPrice(existing.addon, newQuantity, nights, guests);
        
        onAddonsChange(
          selectedAddons.map(s =>
            s.addon.id === addonId
              ? { ...s, quantity: newQuantity, calculatedPrice }
              : s
          )
        );
      } else {
        // Remove addon entirely
        onAddonsChange(selectedAddons.filter(s => s.addon.id !== addonId));
      }
    }
  };

  const getSelectedQuantity = (addonId: string): number => {
    return selectedAddons.find(s => s.addon.id === addonId)?.quantity || 0;
  };

  const formatAddonPrice = (addon: Addon) => {
    const priceInfo = formatPrice(addon.price);
    switch (addon.priceType) {
      case 'per_person':
        return `${priceInfo.display}/person`;
      case 'per_night':
        return `${priceInfo.display}/night`;
      case 'per_person_per_night':
        return `${priceInfo.display}/person/night`;
      default:
        return priceInfo.display;
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse h-24 bg-muted rounded-xl" />
        <div className="animate-pulse h-24 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!addons?.length) {
    return null;
  }

  // Group addons by category
  const groupedAddons = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) {
      acc[addon.category] = [];
    }
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, Addon[]>);

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-serif text-lg font-medium">Enhance Your Stay</h3>
      
      {Object.entries(groupedAddons).map(([category, categoryAddons]) => {
        const Icon = categoryIcons[category] || Gift;
        const isExpanded = expandedCategory === category;

        return (
          <div key={category} className="border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedCategory(isExpanded ? null : category)}
              className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{categoryLabels[category] || category}</div>
                  <div className="text-sm text-muted-foreground">
                    {categoryAddons.length} option{categoryAddons.length > 1 ? 's' : ''} available
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedAddons.some(s => s.addon.category === category) && (
                  <Badge variant="default" className="bg-accent">
                    <Check className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 space-y-3">
                {categoryAddons.map(addon => {
                  const quantity = getSelectedQuantity(addon.id);
                  const isSelected = quantity > 0;

                  return (
                    <Card
                      key={addon.id}
                      className={cn(
                        'transition-all',
                        isSelected && 'ring-2 ring-primary bg-primary/5'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium">{addon.name}</div>
                            {addon.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {addon.description}
                              </p>
                            )}
                            <div className="text-sm font-medium text-primary mt-2">
                              {formatAddonPrice(addon)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleRemoveAddon(addon.id)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">{quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleAddAddon(addon)}
                                  disabled={!!addon.maxQuantity && quantity >= addon.maxQuantity}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddAddon(addon)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {selectedAddons.length > 0 && (
        <div className="p-4 bg-secondary/30 rounded-xl">
          <div className="text-sm font-medium mb-2">Selected Add-ons</div>
          <div className="space-y-1">
            {selectedAddons.map(selected => (
              <div key={selected.addon.id} className="flex justify-between text-sm">
                <span>
                  {selected.addon.name}
                  {selected.quantity > 1 && ` × ${selected.quantity}`}
                </span>
                <span className="font-medium">{formatPrice(selected.calculatedPrice).display}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
