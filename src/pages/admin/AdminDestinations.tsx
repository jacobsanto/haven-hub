import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, ExternalLink, Archive, Star } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { useDestinations, useDeleteDestination, useUpdateDestination } from '@/hooks/useDestinations';
import { useProperties } from '@/hooks/useProperties';
import { useExperiences } from '@/hooks/useExperiences';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { DestinationFormDialog } from '@/components/admin/DestinationFormDialog';
import { format } from 'date-fns';

const AdminDestinations = () => {
  const { data: destinations, isLoading } = useDestinations();
  const { data: properties } = useProperties();
  const { data: experiences } = useExperiences();
  const { data: blogPosts } = useBlogPosts();
  const deleteDestination = useDeleteDestination();
  const updateDestination = useUpdateDestination();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getLinkedCounts = (destId: string) => {
    const propCount = properties?.filter((p: any) => p.destination_id === destId).length || 0;
    const expCount = experiences?.filter((e: any) => e.destination_id === destId).length || 0;
    // Blog posts don't have destination_id — show 0 for now
    return { propCount, expCount, blogCount: 0 };
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDestination.mutateAsync(deleteId);
      toast.success('Destination deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete destination');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await updateDestination.mutateAsync({ id, status: 'draft' });
      toast.success('Destination archived');
    } catch {
      toast.error('Failed to archive');
    }
  };

  // Sort: active first, then by name
  const sorted = destinations
    ? [...destinations].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
    : [];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-medium">Destinations</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {destinations?.length || 0} destinations · {destinations?.filter(d => d.status === 'active').length || 0} active
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Destination
            </Button>
          </div>

          <div className="card-organic overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Country</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Properties</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Experiences</TableHead>
                  <TableHead className="hidden md:table-cell">Featured</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <AdminLoadingSkeleton variant="table" rows={5} />
                    </TableCell>
                  </TableRow>
                ) : sorted.length > 0 ? (
                  sorted.map((dest) => {
                    const counts = getLinkedCounts(dest.id);
                    return (
                      <TableRow key={dest.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {dest.hero_image_url ? (
                                <img src={dest.hero_image_url} alt="" className="w-9 h-9 object-cover" />
                              ) : (
                                <MapPin className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{dest.name}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{dest.country}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{dest.country}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center text-sm">{counts.propCount}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center text-sm">{counts.expCount}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Switch
                            checked={dest.is_featured}
                            onCheckedChange={async (checked) => {
                              try {
                                await updateDestination.mutateAsync({ id: dest.id, is_featured: checked });
                                toast.success(checked ? 'Marked as featured' : 'Removed from featured');
                              } catch {
                                toast.error('Failed to update');
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={dest.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {dest.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {format(new Date(dest.updated_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card">
                              <DropdownMenuItem onClick={() => setEditId(dest.id)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/destinations/${dest.slug}`, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" /> View Page
                              </DropdownMenuItem>
                              {dest.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleArchive(dest.id)}>
                                  <Archive className="h-4 w-4 mr-2" /> Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setDeleteId(dest.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
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
          </div>
        </div>

        <DestinationFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
        <DestinationFormDialog
          open={!!editId}
          onOpenChange={(open) => !open && setEditId(null)}
          destinationId={editId || undefined}
        />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Destination</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All linked properties will lose their destination reference.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
