import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { useExperiences, useDeleteExperience, useUpdateExperience } from '@/hooks/useExperiences';
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
import { ExperienceFormDialog } from '@/components/admin/ExperienceFormDialog';

const AdminExperiences = () => {
  const { data: experiences, isLoading } = useExperiences();
  const deleteExperience = useDeleteExperience();
  const updateExperience = useUpdateExperience();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteExperience.mutateAsync(deleteId);
      toast.success('Experience deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete experience');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateExperience.mutateAsync({
        id,
        status: currentStatus === 'active' ? 'draft' : 'active',
      });
      toast.success('Experience status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      await updateExperience.mutateAsync({
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
              <h1 className="text-2xl md:text-3xl font-serif font-medium">Experiences</h1>
              <p className="text-muted-foreground mt-1">
                Manage curated experiences for your guests
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Experience
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
                  <TableHead>Experience</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <AdminLoadingSkeleton variant="table" rows={4} />
                    </TableCell>
                  </TableRow>
                ) : experiences && experiences.length > 0 ? (
                  experiences.map((experience) => (
                    <TableRow key={experience.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {experience.hero_image_url ? (
                              <img
                                src={experience.hero_image_url}
                                alt={experience.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <Sparkles className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{experience.name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">
                              {experience.category}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{experience.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {experience.price_from ? `€${experience.price_from}` : '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge 
                          variant={experience.status === 'active' ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(experience.id, experience.status)}
                        >
                          {experience.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(experience.id, experience.is_featured)}
                        >
                          {experience.is_featured ? (
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
                            onClick={() => setEditId(experience.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(experience.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <AdminEmptyState
                        icon={Sparkles}
                        title="No experiences yet"
                        description="Create curated experiences for your guests"
                        actionLabel="Add Experience"
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
        <ExperienceFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        {/* Edit Dialog */}
        <ExperienceFormDialog
          open={!!editId}
          onOpenChange={(open) => !open && setEditId(null)}
          experienceId={editId || undefined}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Experience</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this experience? This will also delete any related enquiries. This action cannot be undone.
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

export default AdminExperiences;
