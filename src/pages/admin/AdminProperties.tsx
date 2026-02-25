import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, Eye, MoreVertical,
  Bed, Bath, Users, MapPin, DollarSign, Maximize,
  Building2, LayoutGrid, List,
} from 'lucide-react';
import { getStatusColors } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { TablePagination } from '@/components/admin/TablePagination';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useAdminProperties, useDeleteProperty, useUpdateProperty } from '@/hooks/useProperties';
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
  const deleteProperty = useDeleteProperty();
  const updateProperty = useUpdateProperty();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredProperties = properties?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = properties
    ? {
        all: properties.length,
        active: properties.filter((p) => p.status === 'active').length,
        draft: properties.filter((p) => p.status === 'draft').length,
        archived: properties.filter((p) => p.status === 'archived').length,
      }
    : { all: 0, active: 0, draft: 0, archived: 0 };

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
            {/* Status chips */}
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

            <div className="flex gap-2 items-center w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            viewMode === 'grid' ? (
              <AdminLoadingSkeleton variant="cards" />
            ) : (
              <div className="card-organic overflow-hidden">
                <AdminLoadingSkeleton variant="table" rows={8} />
              </div>
            )
          ) : filteredProperties && filteredProperties.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="card-organic overflow-hidden group"
                  >
                    {/* Hero Image */}
                    <div className="relative h-44 bg-muted overflow-hidden">
                      {property.hero_image_url ? (
                        <img
                          src={property.hero_image_url}
                          alt={property.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}

                      {/* Status badge */}
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColors(property.status)}`}
                      >
                        {property.status}
                      </span>

                      {/* Price badge */}
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-card/90 backdrop-blur-sm text-foreground">
                        {formatCurrency(property.base_price)}/night
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-base truncate">{property.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{property.city}, {property.country}</span>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <Bed className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                          <p className="text-xs font-medium mt-1">{property.bedrooms}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <Bath className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                          <p className="text-xs font-medium mt-1">{property.bathrooms}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <Users className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                          <p className="text-xs font-medium mt-1">{property.max_guests}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <Maximize className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                          <p className="text-xs font-medium mt-1">{property.area_sqm ? `${property.area_sqm}` : '—'}</p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 text-xs h-8"
                          onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 text-xs h-8"
                          asChild
                        >
                          <Link to={`/properties/${property.slug}`} target="_blank">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            {property.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleQuickStatus(property.id, 'active')}>
                                Set Active
                              </DropdownMenuItem>
                            )}
                            {property.status !== 'draft' && (
                              <DropdownMenuItem onClick={() => handleQuickStatus(property.id, 'draft')}>
                                Set Draft
                              </DropdownMenuItem>
                            )}
                            {property.status !== 'archived' && (
                              <DropdownMenuItem onClick={() => handleQuickStatus(property.id, 'archived')}>
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(property.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Table view (kept for users who prefer it) */
              <div className="card-organic overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price/Night</TableHead>
                      <TableHead>Max Guests</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              {property.hero_image_url ? (
                                <img src={property.hero_image_url} alt={property.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{property.name}</p>
                              <p className="text-sm text-muted-foreground">{property.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p>{property.city}</p>
                          <p className="text-sm text-muted-foreground">{property.country}</p>
                        </TableCell>
                        <TableCell>{formatCurrency(property.base_price)}</TableCell>
                        <TableCell>{property.max_guests}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColors(property.status)}`}>
                            {property.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Property options">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card">
                              <DropdownMenuItem asChild>
                                <Link to={`/properties/${property.slug}`} target="_blank">
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/properties/${property.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </Link>
                              </DropdownMenuItem>
                              {property.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleQuickStatus(property.id, 'active')}>Set Active</DropdownMenuItem>
                              )}
                              {property.status !== 'draft' && (
                                <DropdownMenuItem onClick={() => handleQuickStatus(property.id, 'draft')}>Set Draft</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
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
            )
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