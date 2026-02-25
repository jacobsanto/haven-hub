import { useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Package, GripVertical, ArrowUpDown, Eye } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useAdminAddons, useUpdateAddon, useDeleteAddon, useCreateAddon,
  useAddonPerformance, AddonCatalog,
} from '@/hooks/useAdminAddons';
import { AddonFormDialog } from '@/components/admin/AddonFormDialog';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { toast } from 'sonner';

const priceTypeLabels: Record<string, string> = {
  fixed: 'Fixed',
  per_person: 'Per Guest',
  per_night: 'Per Night',
  per_person_per_night: 'Per Guest/Night',
};

const visibilityLabels: Record<string, string> = {
  booking: 'Booking',
  post_booking: 'Post-Booking',
  both: 'Both',
};

export default function AdminAddonsManagement() {
  const { format: formatCurrency } = useFormatCurrency();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonCatalog | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: addons, isLoading } = useAdminAddons();
  const { data: performance, isLoading: perfLoading } = useAddonPerformance();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();
  const createAddon = useCreateAddon();

  const bookingAddons = addons?.filter(a => a.visibility === 'booking' || a.visibility === 'both') || [];
  const postBookingAddons = addons?.filter(a => a.visibility === 'post_booking' || a.visibility === 'both') || [];

  const handleToggleActive = async (addon: AddonCatalog) => {
    try {
      await updateAddon.mutateAsync({ id: addon.id, is_active: !addon.is_active });
      toast.success(`Add-on ${addon.is_active ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed to update'); }
  };

  const handleDuplicate = async (addon: AddonCatalog) => {
    try {
      await createAddon.mutateAsync({
        name: `${addon.name} (Copy)`,
        description: addon.description,
        category: addon.category,
        price: addon.price,
        price_type: addon.price_type,
        property_id: addon.property_id,
        max_quantity: addon.max_quantity,
        requires_lead_time_hours: addon.requires_lead_time_hours,
        image_url: addon.image_url,
        is_active: false,
        sort_order: (addon.sort_order || 0) + 1,
        visibility: addon.visibility || 'booking',
        internal_cost: addon.internal_cost,
        confirmation_type: addon.confirmation_type || 'auto',
        availability_mode: addon.availability_mode || 'unlimited',
        daily_capacity: addon.daily_capacity,
        season_start: addon.season_start,
        season_end: addon.season_end,
      });
      toast.success('Add-on duplicated');
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAddon.mutateAsync(deleteId);
      toast.success('Add-on deleted');
      setDeleteId(null);
    } catch { toast.error('Failed to delete'); }
  };

  const handleEdit = (addon: AddonCatalog) => { setEditingAddon(addon); setDialogOpen(true); };
  const handleDialogClose = () => { setDialogOpen(false); setEditingAddon(null); };

  const margin = (addon: AddonCatalog) => {
    if (addon.internal_cost == null || addon.price <= 0) return null;
    return Math.round(((addon.price - addon.internal_cost) / addon.price) * 100);
  };

  const renderAllTable = (items: AddonCatalog[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Pricing</TableHead>
          <TableHead>Margin %</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(addon => (
          <TableRow key={addon.id}>
            <TableCell className="font-medium">{addon.name}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">{addon.category}</Badge>
            </TableCell>
            <TableCell>
              {formatCurrency(addon.price)} <span className="text-xs text-muted-foreground">{priceTypeLabels[addon.price_type]}</span>
            </TableCell>
            <TableCell>
              {margin(addon) != null ? `${margin(addon)}%` : <span className="text-muted-foreground">—</span>}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{visibilityLabels[addon.visibility] || addon.visibility}</Badge>
            </TableCell>
            <TableCell>
              <Switch checked={addon.is_active} onCheckedChange={() => handleToggleActive(addon)} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(addon)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDuplicate(addon)}><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(addon.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No add-ons found</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderVisibilityTable = (items: AddonCatalog[], showConfirmation?: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8"><GripVertical className="h-4 w-4 text-muted-foreground" /></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Sort</TableHead>
          {showConfirmation && <TableHead>Confirmation</TableHead>}
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.sort((a, b) => a.sort_order - b.sort_order).map(addon => (
          <TableRow key={addon.id}>
            <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></TableCell>
            <TableCell className="font-medium">{addon.name}</TableCell>
            <TableCell>{addon.sort_order}</TableCell>
            {showConfirmation && (
              <TableCell>
                <Badge variant={addon.confirmation_type === 'auto' ? 'default' : 'secondary'}>
                  {addon.confirmation_type === 'auto' ? 'Auto' : 'Manual'}
                </Badge>
              </TableCell>
            )}
            <TableCell>
              <Switch checked={addon.is_active} onCheckedChange={() => handleToggleActive(addon)} />
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(addon)}><Pencil className="h-4 w-4" /></Button>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow><TableCell colSpan={showConfirmation ? 6 : 5} className="text-center py-8 text-muted-foreground">No add-ons in this category</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">Add-ons Engine</h1>
              <p className="text-muted-foreground">Manage upsells, services, and post-booking extras</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add New
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Add-ons ({addons?.length || 0})</TabsTrigger>
              <TabsTrigger value="booking">Booking Page ({bookingAddons.length})</TabsTrigger>
              <TabsTrigger value="post">Post-Booking ({postBookingAddons.length})</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading…</div>
              ) : renderAllTable(addons || [])}
            </TabsContent>

            <TabsContent value="booking" className="mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading…</div>
              ) : renderVisibilityTable(bookingAddons)}
            </TabsContent>

            <TabsContent value="post" className="mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading…</div>
              ) : renderVisibilityTable(postBookingAddons, true)}
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              {perfLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading performance…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Add-on</TableHead>
                      <TableHead>Revenue (30d)</TableHead>
                      <TableHead>Attach Rate %</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Refund Rate %</TableHead>
                      <TableHead>Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(performance || []).map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{formatCurrency(p.revenue30d)}</TableCell>
                        <TableCell>
                          <span className={p.attachRate < 5 ? 'text-destructive font-medium' : ''}>
                            {p.attachRate}%
                          </span>
                        </TableCell>
                        <TableCell>{p.totalBookingsWithAddon}</TableCell>
                        <TableCell>{p.refundRate}%</TableCell>
                        <TableCell>
                          {p.margin != null ? `${p.margin}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!performance || performance.length === 0) && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No performance data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <AddonFormDialog open={dialogOpen} onOpenChange={handleDialogClose} addon={editingAddon} />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Add-on</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}
