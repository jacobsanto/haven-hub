import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, GripVertical, Package } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAdminAddons, useUpdateAddon, useDeleteAddon, AddonCatalog } from '@/hooks/useAdminAddons';
import { AddonFormDialog } from '@/components/admin/AddonFormDialog';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ADDON_CATEGORIES = ['transfer', 'food', 'experience', 'service', 'package'];

const categoryColors: Record<string, string> = {
  transfer: 'bg-blue-100 text-blue-700',
  food: 'bg-orange-100 text-orange-700',
  experience: 'bg-purple-100 text-purple-700',
  service: 'bg-green-100 text-green-700',
  package: 'bg-pink-100 text-pink-700',
};

const priceTypeLabels: Record<string, string> = {
  fixed: 'Fixed',
  per_person: 'Per Person',
  per_night: 'Per Night',
  per_person_per_night: 'Per Person/Night',
};

export default function AdminAddonsManagement() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonCatalog | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: addons, isLoading } = useAdminAddons();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  const filteredAddons = addons?.filter(
    (addon) => categoryFilter === 'all' || addon.category === categoryFilter
  );

  const handleToggleActive = async (addon: AddonCatalog) => {
    try {
      await updateAddon.mutateAsync({
        id: addon.id,
        is_active: !addon.is_active,
      });
      toast.success(`Add-on ${addon.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update add-on');
    }
  };

  const handleEdit = (addon: AddonCatalog) => {
    setEditingAddon(addon);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAddon.mutateAsync(deleteId);
      toast.success('Add-on deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete add-on');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAddon(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">Add-ons</h1>
              <p className="text-muted-foreground">
                Manage upsells and additional services for bookings
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Filter by Category:</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {ADDON_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Add-ons List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Add-ons Catalog ({filteredAddons?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading add-ons...
                </div>
              ) : filteredAddons && filteredAddons.length > 0 ? (
                <div className="space-y-3">
                  {filteredAddons.map((addon, index) => (
                    <motion.div
                      key={addon.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      
                      {addon.image_url ? (
                        <img
                          src={addon.image_url}
                          alt={addon.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{addon.name}</h3>
                          <Badge
                            variant="secondary"
                            className={categoryColors[addon.category] || ''}
                          >
                            {addon.category}
                          </Badge>
                          {addon.property_id && (
                            <Badge variant="outline">Property-specific</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {addon.description || 'No description'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(addon.price)}</p>
                        <p className="text-xs text-muted-foreground">
                          {priceTypeLabels[addon.price_type] || addon.price_type}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={addon.is_active}
                          onCheckedChange={() => handleToggleActive(addon)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(addon)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(addon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No add-ons found. Create your first add-on to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form Dialog */}
        <AddonFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          addon={editingAddon}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Add-on</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this add-on? This action cannot be undone.
              </AlertDialogDescription>
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
