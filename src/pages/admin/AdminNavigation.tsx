import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Eye, EyeOff, Smartphone } from 'lucide-react';
import { useAdminNavigationItems, useNavigationMutations, NavigationPlacement, NavigationItem } from '@/hooks/useNavigationItems';
import { useHeroSettings, useHeroSettingsMutations } from '@/hooks/useHeroSettings';
import { useProperties } from '@/hooks/useProperties';
import { NavigationItemFormDialog } from '@/components/admin/NavigationItemFormDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PLACEMENT_TABS: { value: NavigationPlacement; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'hero_quicknav', label: 'Hero Quick Nav' },
  { value: 'footer_explore', label: 'Footer – Explore' },
  { value: 'footer_company', label: 'Footer – Company' },
];

function NavigationTable({ placement }: { placement: NavigationPlacement }) {
  const { data: items, isLoading } = useAdminNavigationItems(placement);
  const { createItem, updateItem, deleteItem } = useNavigationMutations();
  const { toast } = useToast();
  const [editItem, setEditItem] = useState<NavigationItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = async (data: Omit<NavigationItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editItem) {
        await updateItem.mutateAsync({ id: editItem.id, ...data });
        toast({ title: 'Navigation item updated' });
      } else {
        await createItem.mutateAsync(data);
        toast({ title: 'Navigation item created' });
      }
      setFormOpen(false);
      setEditItem(null);
    } catch {
      toast({ title: 'Error saving item', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteItem.mutateAsync(deleteId);
      toast({ title: 'Navigation item deleted' });
    } catch {
      toast({ title: 'Error deleting item', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const toggleVisibility = async (item: NavigationItem) => {
    await updateItem.mutateAsync({ id: item.id, is_visible: !item.is_visible });
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Path</TableHead>
            {placement === 'hero_quicknav' && <TableHead>Icon</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.sort_order}</TableCell>
              <TableCell className="font-medium">{item.label}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{item.path}</TableCell>
              {placement === 'hero_quicknav' && (
                <TableCell className="text-sm">{item.icon || '—'}</TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  {item.is_visible ? (
                    <Badge variant="default" className="gap-1"><Eye className="h-3 w-3" /> Visible</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Hidden</Badge>
                  )}
                  {item.show_on_mobile && (
                    <Badge variant="outline" className="gap-1"><Smartphone className="h-3 w-3" /></Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggleVisibility(item)} aria-label="Toggle visibility">
                    {item.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(!items || items.length === 0) && (
            <TableRow>
              <TableCell colSpan={placement === 'hero_quicknav' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                No items yet. Click "Add Item" to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <NavigationItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editItem}
        defaultPlacement={placement}
        onSave={handleSave}
        isLoading={createItem.isPending || updateItem.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete navigation item?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function HeroSettingsPanel() {
  const { settings, showSearchBar, showFeaturedVilla, featuredPropertyId, showQuickNav } = useHeroSettings();
  const { updateSetting } = useHeroSettingsMutations();
  const { data: properties } = useProperties();
  const { toast } = useToast();

  const handleToggle = async (key: string, current: boolean) => {
    try {
      await updateSetting.mutateAsync({ key, value: current ? 'false' : 'true' });
      toast({ title: 'Setting updated' });
    } catch {
      toast({ title: 'Error updating setting', variant: 'destructive' });
    }
  };

  const handlePropertyChange = async (value: string) => {
    try {
      await updateSetting.mutateAsync({ key: 'featured_property_id', value });
      toast({ title: 'Featured property updated' });
    } catch {
      toast({ title: 'Error updating setting', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section Settings</CardTitle>
        <CardDescription>Control which elements appear in the homepage hero section</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Search Bar</Label>
            <p className="text-xs text-muted-foreground">Show the search bar in the hero section</p>
          </div>
          <Switch checked={showSearchBar} onCheckedChange={() => handleToggle('show_search_bar', showSearchBar)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Quick Navigation Icons</Label>
            <p className="text-xs text-muted-foreground">Show quick-nav icons at the bottom of the hero</p>
          </div>
          <Switch checked={showQuickNav} onCheckedChange={() => handleToggle('show_quick_nav', showQuickNav)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Featured Villa Card</Label>
            <p className="text-xs text-muted-foreground">Show the featured property card in the hero</p>
          </div>
          <Switch checked={showFeaturedVilla} onCheckedChange={() => handleToggle('show_featured_villa', showFeaturedVilla)} />
        </div>

        {showFeaturedVilla && (
          <div className="space-y-2 pl-4 border-l-2 border-primary/20">
            <Label className="text-sm font-medium">Featured Property</Label>
            <Select value={featuredPropertyId} onValueChange={handlePropertyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (first featured property)</SelectItem>
                {properties?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const AdminNavigation = () => {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-medium">Navigation Manager</h1>
            <p className="text-muted-foreground">Manage header, footer, and hero navigation items</p>
          </div>

          <HeroSettingsPanel />

          <Card>
            <CardHeader>
              <CardTitle>Navigation Items</CardTitle>
              <CardDescription>Add, edit, reorder, and toggle visibility of navigation links across your site</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="header">
                <TabsList className="mb-4">
                  {PLACEMENT_TABS.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                  ))}
                </TabsList>
                {PLACEMENT_TABS.map(tab => (
                  <TabsContent key={tab.value} value={tab.value}>
                    <NavigationTable placement={tab.value} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminNavigation;
