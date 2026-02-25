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
import { Plus, Pencil, Trash2, Eye, EyeOff, Smartphone, ExternalLink } from 'lucide-react';
import { useAdminNavigationItems, useNavigationMutations, NavigationPlacement, NavigationItem } from '@/hooks/useNavigationItems';
import { useHeroSettings, useHeroSettingsMutations } from '@/hooks/useHeroSettings';
import { useProperties } from '@/hooks/useProperties';
import { NavigationItemFormDialog } from '@/components/admin/NavigationItemFormDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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
        toast({ title: 'Item updated' });
      } else {
        await createItem.mutateAsync(data);
        toast({ title: 'Item created' });
      }
      setFormOpen(false);
      setEditItem(null);
    } catch { toast({ title: 'Error saving', variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteItem.mutateAsync(deleteId); toast({ title: 'Item deleted' }); }
    catch { toast({ title: 'Error deleting', variant: 'destructive' }); }
    setDeleteId(null);
  };

  if (isLoading) return <div className="py-6 text-center text-muted-foreground text-sm">Loading…</div>;

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Order</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Path</TableHead>
            {placement === 'hero_quicknav' && <TableHead>Icon</TableHead>}
            <TableHead className="text-center">Desktop</TableHead>
            <TableHead className="text-center">Mobile</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">{item.sort_order}</TableCell>
              <TableCell className="font-medium text-sm">{item.label}</TableCell>
              <TableCell className="text-muted-foreground text-xs">{item.path}</TableCell>
              {placement === 'hero_quicknav' && <TableCell className="text-xs">{item.icon || '—'}</TableCell>}
              <TableCell className="text-center">
                {item.is_visible ? <Eye className="h-4 w-4 text-primary mx-auto" /> : <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />}
              </TableCell>
              <TableCell className="text-center">
                {item.show_on_mobile ? <Smartphone className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(item); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(!items || items.length === 0) && (
            <TableRow>
              <TableCell colSpan={placement === 'hero_quicknav' ? 7 : 6} className="text-center py-6 text-muted-foreground text-sm">
                No items. Click "Add Item" to start.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <NavigationItemFormDialog open={formOpen} onOpenChange={setFormOpen} item={editItem} defaultPlacement={placement}
        onSave={handleSave} isLoading={createItem.isPending || updateItem.isPending} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete item?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function HeroSettingsPanel() {
  const { showSearchBar, showFeaturedVilla, featuredPropertyId, showQuickNav } = useHeroSettings();
  const { updateSetting } = useHeroSettingsMutations();
  const { data: properties } = useProperties();
  const { toast } = useToast();

  const handleToggle = async (key: string, current: boolean) => {
    try { await updateSetting.mutateAsync({ key, value: current ? 'false' : 'true' }); toast({ title: 'Updated' }); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Hero Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Label className="text-sm">Search Bar</Label><p className="text-xs text-muted-foreground">Show in hero</p></div>
          <Switch checked={showSearchBar} onCheckedChange={() => handleToggle('show_search_bar', showSearchBar)} />
        </div>
        <div className="flex items-center justify-between">
          <div><Label className="text-sm">Quick Nav Icons</Label><p className="text-xs text-muted-foreground">Bottom of hero</p></div>
          <Switch checked={showQuickNav} onCheckedChange={() => handleToggle('show_quick_nav', showQuickNav)} />
        </div>
        <div className="flex items-center justify-between">
          <div><Label className="text-sm">Featured Villa Card</Label><p className="text-xs text-muted-foreground">In hero section</p></div>
          <Switch checked={showFeaturedVilla} onCheckedChange={() => handleToggle('show_featured_villa', showFeaturedVilla)} />
        </div>
        {showFeaturedVilla && (
          <div className="space-y-1 pl-4 border-l-2 border-primary/20">
            <Label className="text-xs">Property</Label>
            <Select value={featuredPropertyId} onValueChange={async (v) => {
              try { await updateSetting.mutateAsync({ key: 'featured_property_id', value: v }); toast({ title: 'Updated' }); } catch {}
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                {properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-medium">Navigation</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage header, footer, and hero navigation</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open('/', '_blank')}>
              <ExternalLink className="h-4 w-4" /> Preview Site
            </Button>
          </div>

          <HeroSettingsPanel />

          <Tabs defaultValue="header">
            <TabsList className="mb-3">
              {PLACEMENT_TABS.map(tab => <TabsTrigger key={tab.value} value={tab.value} className="text-xs">{tab.label}</TabsTrigger>)}
            </TabsList>
            {PLACEMENT_TABS.map(tab => (
              <TabsContent key={tab.value} value={tab.value}>
                <div className="card-organic overflow-hidden p-4">
                  <NavigationTable placement={tab.value} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminNavigation;
