import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { useDestinations, useDeleteDestination, useUpdateDestination } from '@/hooks/useDestinations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';
import { DestinationFormDialog } from '@/components/admin/DestinationFormDialog';

const AdminDestinations = () => {
  const { data: destinations, isLoading } = useDestinations();
  const deleteDestination = useDeleteDestination();
  const updateDestination = useUpdateDestination();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteDestination.mutateAsync(deleteId);
      toast.success('Destination deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete destination');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDestination.mutateAsync({
        id,
        status: currentStatus === 'active' ? 'draft' : 'active',
      });
      toast.success('Destination status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await updateDestination.mutateAsync({
        id,
        is_featured: !isFeatured,
      });
      toast.success(isFeatured ? 'Removed from featured' : 'Added to featured');
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-medium">Destinations</h1>
              <p className="text-muted-foreground mt-1">
                Manage your destination pages
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Destination
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-organic overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead className="hidden md:table-cell">Country</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <AdminLoadingSkeleton variant="table" rows={4} />
                    </TableCell>
                  </TableRow>
                ) : destinations && destinations.length > 0 ? (
                  destinations.map((destination) => (
                    <TableRow key={destination.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {destination.hero_image_url ? (
                              <img
                                src={destination.hero_image_url}
                                alt={destination.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <MapPin className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{destination.name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">
                              {destination.country}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {destination.country}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge 
                          variant={destination.status === 'active' ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(destination.id, destination.status)}
                        >
                          {destination.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(destination.id, destination.is_featured)}
                        >
                          {destination.is_featured ? (
                            <Eye className="h-4 w-4 text-primary" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditId(destination.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(destination.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <AdminEmptyState
                        icon={MapPin}
                        title="No destinations yet"
                        description="Add destinations to showcase your locations"
                        actionLabel="Add Destination"
                        onAction={() => setShowCreateDialog(true)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </motion.div>
        </div>

        {/* Create Dialog */}
        <DestinationFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        {/* Edit Dialog */}
        <DestinationFormDialog
          open={!!editId}
          onOpenChange={(open) => !open && setEditId(null)}
          destinationId={editId || undefined}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Destination</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this destination? This action cannot be undone.
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
};

export default AdminDestinations;
