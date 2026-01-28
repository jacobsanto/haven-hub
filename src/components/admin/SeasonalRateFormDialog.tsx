import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Sun, Snowflake, Leaf, Flower2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SeasonalRate } from '@/types/database';

interface SeasonalRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRate: SeasonalRate | null;
  propertyId: string;
  propertyBasePrice: number;
  onSubmit: (data: Omit<SeasonalRate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  isSubmitting: boolean;
}

const SEASON_PRESETS = [
  { value: 'high_season', label: 'High Season', icon: Sun, multiplier: 1.5, color: 'text-orange-500' },
  { value: 'peak_season', label: 'Peak Season', icon: Sun, multiplier: 2.0, color: 'text-red-500' },
  { value: 'low_season', label: 'Low Season', icon: Snowflake, multiplier: 0.8, color: 'text-blue-500' },
  { value: 'shoulder_season', label: 'Shoulder Season', icon: Leaf, multiplier: 1.2, color: 'text-amber-600' },
  { value: 'spring_special', label: 'Spring Special', icon: Flower2, multiplier: 1.1, color: 'text-pink-500' },
  { value: 'custom', label: 'Custom', icon: Calendar, multiplier: 1.0, color: 'text-muted-foreground' },
];

export function SeasonalRateFormDialog({
  open,
  onOpenChange,
  editingRate,
  propertyId,
  propertyBasePrice,
  onSubmit,
  isSubmitting,
}: SeasonalRateFormDialogProps) {
  const today = new Date();
  const [useFixedRate, setUseFixedRate] = useState(false);
  const [formData, setFormData] = useState({
    property_id: propertyId,
    name: '',
    start_date: format(today, 'yyyy-MM-dd'),
    end_date: format(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()), 'yyyy-MM-dd'),
    price_multiplier: 1.0,
    nightly_rate: null as number | null,
  });

  useEffect(() => {
    if (editingRate) {
      setFormData({
        property_id: editingRate.property_id,
        name: editingRate.name,
        start_date: editingRate.start_date,
        end_date: editingRate.end_date,
        price_multiplier: editingRate.price_multiplier,
        nightly_rate: editingRate.nightly_rate,
      });
      setUseFixedRate(!!editingRate.nightly_rate);
    } else {
      setFormData({
        property_id: propertyId,
        name: '',
        start_date: format(today, 'yyyy-MM-dd'),
        end_date: format(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()), 'yyyy-MM-dd'),
        price_multiplier: 1.0,
        nightly_rate: null,
      });
      setUseFixedRate(false);
    }
  }, [editingRate, propertyId, open]);

  const handlePresetSelect = (presetValue: string) => {
    const preset = SEASON_PRESETS.find(p => p.value === presetValue);
    if (preset && preset.value !== 'custom') {
      setFormData(prev => ({
        ...prev,
        name: preset.label,
        price_multiplier: preset.multiplier,
      }));
    }
  };

  const calculateEffectiveRate = () => {
    if (useFixedRate && formData.nightly_rate) {
      return formData.nightly_rate;
    }
    return propertyBasePrice * formData.price_multiplier;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      nightly_rate: useFixedRate ? formData.nightly_rate : null,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editingRate ? 'Edit Seasonal Rate' : 'Create Seasonal Rate'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Season Preset */}
          <div className="space-y-2">
            <Label>Season Preset</Label>
            <div className="grid grid-cols-3 gap-2">
              {SEASON_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = formData.name === preset.label || 
                  (preset.value === 'custom' && !SEASON_PRESETS.slice(0, -1).some(p => p.label === formData.name));
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() => handlePresetSelect(preset.value)}
                  >
                    <Icon className={cn("h-4 w-4", !isSelected && preset.color)} />
                    <span className="text-xs">{preset.label.replace(' Season', '').replace(' Special', '')}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Season Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer 2026"
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(parseISO(formData.start_date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.start_date ? parseISO(formData.start_date) : undefined}
                    onSelect={(date) => date && setFormData({ ...formData, start_date: format(date, 'yyyy-MM-dd') })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(parseISO(formData.end_date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.end_date ? parseISO(formData.end_date) : undefined}
                    onSelect={(date) => date && setFormData({ ...formData, end_date: format(date, 'yyyy-MM-dd') })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Pricing Mode Toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
            <div>
              <Label>Use Fixed Nightly Rate</Label>
              <p className="text-xs text-muted-foreground">
                {useFixedRate ? 'Override base price with a fixed amount' : 'Apply multiplier to base price'}
              </p>
            </div>
            <Switch
              checked={useFixedRate}
              onCheckedChange={setUseFixedRate}
            />
          </div>

          {/* Pricing Fields */}
          {useFixedRate ? (
            <div className="space-y-2">
              <Label htmlFor="nightly_rate">Fixed Nightly Rate (€) *</Label>
              <Input
                id="nightly_rate"
                type="number"
                min="0"
                step="1"
                value={formData.nightly_rate || ''}
                onChange={(e) => setFormData({ ...formData, nightly_rate: parseFloat(e.target.value) || null })}
                placeholder="e.g., 500"
                required={useFixedRate}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="price_multiplier">Price Multiplier *</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="price_multiplier"
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.05"
                  value={formData.price_multiplier}
                  onChange={(e) => setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) || 1 })}
                  className="w-24"
                  required={!useFixedRate}
                />
                <span className="text-sm text-muted-foreground">×</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formData.price_multiplier > 1 ? '+' : ''}{((formData.price_multiplier - 1) * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formData.price_multiplier > 1 ? 'increase' : formData.price_multiplier < 1 ? 'decrease' : 'no change'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                1.0 = base price, 1.5 = 50% increase, 0.8 = 20% discount
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Effective nightly rate</p>
                <p className="text-2xl font-semibold text-primary">
                  {formatCurrency(calculateEffectiveRate())}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Base price</p>
                <p className="text-lg font-medium">{formatCurrency(propertyBasePrice)}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingRate ? 'Save Changes' : 'Create Seasonal Rate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
