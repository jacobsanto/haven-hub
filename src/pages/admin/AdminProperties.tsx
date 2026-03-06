import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2, Eye, MoreVertical,
  Building2, Copy, Archive,
} from 'lucide-react';
import { format } from 'date-fns';
import { getStatusColors } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { useAdminProperties, useDeleteProperty, useUpdateProperty, useCreateProperty } from '@/hooks/useProperties';
import { useAdminRatePlans } from '@/hooks/useAdminRatePlans';
import { useAdminSpecialOffers } from '@/hooks/useAdminPromotions';
import { useDestinations } from '@/hooks/useDestinations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { Switch } from '@/components/ui/switch';
import { PropertyStatus } from '@/types/database';

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

export default function AdminProperties() {
  const navigate = useNavigate();
  const { format: formatCurrency } = useFormatCurrency();
  const { data: properties, isLoading } = useAdminProperties();
  const { data: destinations } = useDestinations();
  const { data: ratePlans } = useAdminRatePlans();
  const { data: specialOffers } = useAdminSpecialOffers();
  const deleteProperty = useDeleteProperty();
  const updateProperty = useUpdateProperty();
  const createProperty = useCreateProperty();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sort: active first, then by name
  const sortedAndFiltered = useMemo(() => {
    if (!properties) return [];
    const filtered = properties.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.country.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const statusOrder: Record<string, number> = { active: 0, draft: 1, archived: 2 };
    return filtered.sort((a, b) => {
      const sa = statusOrder[a.status] ?? 9;
      const sb = statusOrder[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });
  }, [properties, search, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!properties) return { all: 0, active: 0, draft: 0, archived: 0 };
    return {
      all: properties.length,
      active: properties.filter((p) => p.status === 'active').length,
      draft: properties.filter((p) => p.status === 'draft').length,
      archived: properties.filter((p) => p.status === 'archived').length,
    };
  }, [properties]);

  const getDestinationName = (destId: string | null) => {
    if (!destId || !destinations) return '—';
    return destinations.find((d) => d.id === destId)?.name || '—';
  };

  const getActiveRatePlans = (propId: string) => {
    if (!ratePlans) return 0;
    return ratePlans.filter((r) => r.property_id === propId && r.is_active).length;
  };

  const getActivePromotions = (propId: string) => {
    if (!specialOffers) return 0;
    const now = new Date();
    return specialOffers.filter((o) =>
      o.property_id === propId && o.is_active &&
      new Date(o.valid_from) <= now && new Date(o.valid_until) >= now
    ).length;
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProperty.mutateAsync(deleteId);
      toast({ title: 'Property Deleted', description: 'The property has been successfully deleted.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete property.', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleQuickStatus = async (id: string, status: PropertyStatus) => {
    try {
      await updateProperty.mutateAsync({ id, status });
      toast({ title: 'Status Updated', description: `Property is now ${status}.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (propId: string) => {
    const prop = properties?.find((p) => p.id === propId);
    if (!prop) return;
    try {
      const { id, created_at, updated_at, slug, ...rest } = prop;
      await createProperty.mutateAsync({
        ...rest,
        name: `${prop.name} (Copy)`,
        slug: `${prop.slug}-copy-${Date.now()}`,
        status: 'draft' as PropertyStatus,
      });
      toast({ title: 'Property Duplicated', description: 'A draft copy has been created.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to duplicate property.', variant: 'destructive' });
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">Properties</h1>
              <p className="text-muted-foreground">
                {properties?.length || 0} properties &middot; {statusCounts.active} active
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/properties/quick-onboard">
                <Button variant="outline" className="rounded-full gap-2">
                  <Plus className="h-4 w-4" />
                  Quick Onboard
                </Button>
              </Link>
              <Link to="/admin/properties/new">
                <Button className="rounded-full gap-2">
                  <Plus className="h-4 w-4" />
                  Full Form
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const count = statusCounts[opt.value as keyof typeof statusCounts] || 0;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <AdminLoadingSkeleton variant="table" rows={8} />
          ) : sortedAndFiltered.length > 0 ? (
            <div className="card-organic overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Base Rate</TableHead>
                    <TableHead className="text-center">Promotions</TableHead>
                    <TableHead className="text-center">Rate Plans</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFiltered.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {property.hero_image_url ? (
                              <img src={property.hero_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{property.display_name || property.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{property.city}, {property.country}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {getDestinationName(property.destination_id)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColors(property.status)}`}>
                          {property.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(property.base_price)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getActivePromotions(property.id) > 0 ? (
                          <Badge variant="secondary" className="text-xs">{getActivePromotions(property.id)}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getActiveRatePlans(property.id) > 0 ? (
                          <Badge variant="secondary" className="text-xs">{getActiveRatePlans(property.id)}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(property.updated_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuItem onClick={() => navigate(`/admin/properties/${property.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/properties/${property.slug}`} target="_blank">
                                <Eye className="h-4 w-4 mr-2" /> View on Site
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(property.id)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {property.status !== 'archived' ? (
                              <DropdownMenuItem onClick={() => handleQuickStatus(property.id, 'archived')}>
                                <Archive className="h-4 w-4 mr-2" /> Archive
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleQuickStatus(property.id, 'draft')}>
                                Set Draft
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(property.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <AdminEmptyState
              icon={Building2}
              title={search || statusFilter !== 'all' ? 'No properties match your filters' : 'No properties yet'}
              description="Add your first property to get started"
              actionLabel="Add Property"
              onAction={() => navigate('/admin/properties/new')}
            />
          )}
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this property? This action cannot be undone.
                All associated bookings will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}
