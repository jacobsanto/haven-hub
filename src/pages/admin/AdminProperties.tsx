import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { getStatusColors } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminProperties, useDeleteProperty } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

export default function AdminProperties() {
  const { format: formatCurrency } = useFormatCurrency();
  const { data: properties, isLoading } = useAdminProperties();
  const deleteProperty = useDeleteProperty();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredProperties = properties?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase())
  );

  // Use centralized EUR formatter for admin display

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteProperty.mutateAsync(deleteId);
      toast({
        title: 'Property Deleted',
        description: 'The property has been successfully deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete property. Please try again.',
        variant: 'destructive',
      });
    }
    setDeleteId(null);
  };

  const getStatusBadge = (status: string) => getStatusColors(status);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">Properties</h1>
              <p className="text-muted-foreground">
                Manage your property listings
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

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 input-organic"
            />
          </div>

          {/* Table */}
          <div className="card-organic overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading properties...</p>
              </div>
            ) : filteredProperties && filteredProperties.length > 0 ? (
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
                              <img
                                src={property.hero_image_url}
                                alt={property.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{property.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {property.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{property.city}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.country}
                        </p>
                      </TableCell>
                      <TableCell>{formatCurrency(property.base_price)}</TableCell>
                      <TableCell>{property.max_guests}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                            property.status
                          )}`}
                        >
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
                              <Link
                                to={`/properties/${property.slug}`}
                                target="_blank"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/properties/${property.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(property.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No properties found</p>
                <Link to="/admin/properties/new">
                  <Button className="rounded-full gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Property
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this property? This action cannot
                be undone. All associated bookings will also be deleted.
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
