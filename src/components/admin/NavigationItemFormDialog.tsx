import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavigationItem, NavigationPlacement } from '@/hooks/useNavigationItems';

interface NavigationItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: NavigationItem | null;
  defaultPlacement: NavigationPlacement;
  onSave: (data: Omit<NavigationItem, 'id' | 'created_at' | 'updated_at'>) => void;
  isLoading?: boolean;
}

const PLACEMENT_OPTIONS: { value: NavigationPlacement; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'hero_quicknav', label: 'Hero Quick Nav' },
  { value: 'footer_explore', label: 'Footer – Explore' },
  { value: 'footer_company', label: 'Footer – Company' },
];

export function NavigationItemFormDialog({
  open,
  onOpenChange,
  item,
  defaultPlacement,
  onSave,
  isLoading,
}: NavigationItemFormDialogProps) {
  const [label, setLabel] = useState('');
  const [path, setPath] = useState('');
  const [icon, setIcon] = useState('');
  const [placement, setPlacement] = useState<NavigationPlacement>(defaultPlacement);
  const [sortOrder, setSortOrder] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showOnMobile, setShowOnMobile] = useState(true);
  const [priority, setPriority] = useState(true);

  useEffect(() => {
    if (item) {
      setLabel(item.label);
      setPath(item.path);
      setIcon(item.icon || '');
      setPlacement(item.placement as NavigationPlacement);
      setSortOrder(item.sort_order);
      setIsVisible(item.is_visible);
      setShowOnMobile(item.show_on_mobile);
      setPriority(item.priority);
    } else {
      setLabel('');
      setPath('');
      setIcon('');
      setPlacement(defaultPlacement);
      setSortOrder(0);
      setIsVisible(true);
      setShowOnMobile(true);
      setPriority(true);
    }
  }, [item, defaultPlacement, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      label,
      path,
      icon: icon || null,
      placement,
      sort_order: sortOrder,
      is_visible: isVisible,
      show_on_mobile: showOnMobile,
      priority,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Navigation Item' : 'Add Navigation Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} required placeholder="e.g. Properties" />
          </div>
          <div className="space-y-2">
            <Label>Path</Label>
            <Input value={path} onChange={e => setPath(e.target.value)} required placeholder="e.g. /properties" />
          </div>
          <div className="space-y-2">
            <Label>Icon (Lucide name, optional)</Label>
            <Input value={icon} onChange={e => setIcon(e.target.value)} placeholder="e.g. MapPin, Home, Sparkles" />
          </div>
          <div className="space-y-2">
            <Label>Placement</Label>
            <Select value={placement} onValueChange={(v) => setPlacement(v as NavigationPlacement)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLACEMENT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Visible</Label>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show on Mobile</Label>
            <Switch checked={showOnMobile} onCheckedChange={setShowOnMobile} />
          </div>
          {placement === 'header' && (
            <div className="flex items-center justify-between">
              <Label>Priority (show on smaller screens)</Label>
              <Switch checked={priority} onCheckedChange={setPriority} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{item ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
