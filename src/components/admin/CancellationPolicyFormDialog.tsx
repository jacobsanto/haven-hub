import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CancellationPolicyDB, CancellationRule, CancellationPolicyFormData } from '@/hooks/useCancellationPolicies';
import { getPolicyBadgeClassByColor } from '@/lib/cancellation-policies';

interface CancellationPolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: CancellationPolicyDB | null;
  onSubmit: (data: CancellationPolicyFormData) => Promise<void>;
  isSubmitting: boolean;
}

const COLOR_OPTIONS = [
  { value: 'green', label: 'Green', description: 'Most flexible' },
  { value: 'yellow', label: 'Yellow', description: 'Moderate' },
  { value: 'orange', label: 'Orange', description: 'Strict' },
  { value: 'red', label: 'Red', description: 'Non-refundable' },
];

export function CancellationPolicyFormDialog({
  open,
  onOpenChange,
  policy,
  onSubmit,
  isSubmitting,
}: CancellationPolicyFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('yellow');
  const [isActive, setIsActive] = useState(true);
  const [rules, setRules] = useState<CancellationRule[]>([
    { daysBeforeCheckIn: 14, refundPercentage: 100 },
    { daysBeforeCheckIn: 7, refundPercentage: 50 },
    { daysBeforeCheckIn: 0, refundPercentage: 0 },
  ]);

  // Reset form when policy changes
  useEffect(() => {
    if (policy) {
      setName(policy.name);
      setDescription(policy.description || '');
      setColor(policy.color);
      setIsActive(policy.is_active);
      setRules(policy.rules.length > 0 ? [...policy.rules] : [{ daysBeforeCheckIn: 0, refundPercentage: 0 }]);
    } else {
      setName('');
      setDescription('');
      setColor('yellow');
      setIsActive(true);
      setRules([
        { daysBeforeCheckIn: 14, refundPercentage: 100 },
        { daysBeforeCheckIn: 7, refundPercentage: 50 },
        { daysBeforeCheckIn: 0, refundPercentage: 0 },
      ]);
    }
  }, [policy, open]);

  // Sort rules by days descending
  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn);
  }, [rules]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Name is required');
    }
    
    if (rules.length === 0) {
      errors.push('At least one rule is required');
    }
    
    // Check for duplicate days
    const days = rules.map(r => r.daysBeforeCheckIn);
    if (new Set(days).size !== days.length) {
      errors.push('Each tier must have unique cutoff days');
    }
    
    // Must have a 0-day rule
    if (!rules.some(r => r.daysBeforeCheckIn === 0)) {
      errors.push('Must include a final rule for 0 days (no refund period)');
    }
    
    // Percentages must be valid
    if (rules.some(r => r.refundPercentage < 0 || r.refundPercentage > 100)) {
      errors.push('Refund percentages must be between 0 and 100');
    }
    
    return errors;
  }, [name, rules]);

  // Generate preview text
  const previewLines = useMemo(() => {
    if (rules.length === 0) return [];
    
    const sorted = [...rules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn);
    const lines: string[] = [];
    
    for (let i = 0; i < sorted.length; i++) {
      const rule = sorted[i];
      const nextRule = sorted[i + 1];
      
      if (rule.daysBeforeCheckIn === 0) {
        if (rule.refundPercentage === 0) {
          const prevDays = sorted[i - 1]?.daysBeforeCheckIn;
          if (prevDays) {
            lines.push(`No refund within ${prevDays} days of check-in`);
          } else {
            lines.push('Non-refundable');
          }
        } else {
          lines.push(`${rule.refundPercentage}% refund at any time`);
        }
      } else if (rule.refundPercentage === 100) {
        lines.push(`Full refund if cancelled ${rule.daysBeforeCheckIn}+ days before check-in`);
      } else if (rule.refundPercentage > 0) {
        const nextDays = nextRule?.daysBeforeCheckIn ?? 0;
        lines.push(`${rule.refundPercentage}% refund if cancelled ${nextDays}-${rule.daysBeforeCheckIn} days before check-in`);
      }
    }
    
    return lines;
  }, [rules]);

  const handleAddRule = () => {
    // Find a good default for new rule
    const existingDays = new Set(rules.map(r => r.daysBeforeCheckIn));
    let newDays = 7;
    while (existingDays.has(newDays)) {
      newDays += 7;
    }
    
    setRules([...rules, { daysBeforeCheckIn: newDays, refundPercentage: 50 }]);
  };

  const handleRemoveRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleRuleChange = (index: number, field: keyof CancellationRule, value: number) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationErrors.length > 0) return;
    
    // Sort rules before submitting
    const sortedForSubmit = [...rules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn);
    
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      color,
      is_active: isActive,
      rules: sortedForSubmit,
    });
  };

  const isEditing = !!policy;
  const isDefaultPolicy = policy?.is_default ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? 'Edit' : 'Create'} Cancellation Policy
            {isDefaultPolicy && (
              <Badge variant="secondary" className="text-xs">System Default</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Policy Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Holiday Flexible"
                disabled={isDefaultPolicy}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Badge Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {COLOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={getPolicyBadgeClassByColor(opt.value)}>
                          {opt.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when to use this policy..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Active (available for selection)</Label>
          </div>

          <Separator />

          {/* Rules Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Refund Rules</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRule}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tier
              </Button>
            </div>

            <div className="space-y-3">
              {sortedRules.map((rule, index) => {
                const originalIndex = rules.findIndex(
                  r => r.daysBeforeCheckIn === rule.daysBeforeCheckIn && r.refundPercentage === rule.refundPercentage
                );
                
                return (
                  <div
                    key={`${rule.daysBeforeCheckIn}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        value={rule.daysBeforeCheckIn}
                        onChange={(e) => handleRuleChange(originalIndex, 'daysBeforeCheckIn', parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">days before →</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.refundPercentage}
                        onChange={(e) => handleRuleChange(originalIndex, 'refundPercentage', parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">% refund</span>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRule(originalIndex)}
                      disabled={rules.length <= 1}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              Rules are automatically sorted by cutoff days (highest first). Always include a 0-day rule for the final refund period.
            </p>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Policy Preview</Label>
            <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getPolicyBadgeClassByColor(color)}>
                  {name || 'Untitled Policy'}
                </Badge>
              </div>
              {previewLines.length > 0 ? (
                <ul className="space-y-1">
                  {previewLines.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Add rules to see preview</p>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || validationErrors.length > 0}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Policy' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
