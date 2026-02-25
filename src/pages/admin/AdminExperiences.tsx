import { useState } from 'react';
import { Plus, Sparkles, Edit, Copy, ExternalLink } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { useExperiences, useDeleteExperience, useUpdateExperience, useCreateExperience } from '@/hooks/useExperiences';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { ExperienceFormDialog } from '@/components/admin/ExperienceFormDialog';

const AdminExperiences = () => {
  const { data: experiences, isLoading } = useExperiences();
  const deleteExperience = useDeleteExperience();
  const updateExperience = useUpdateExperience();
  const duplicateExperience = useCreateExperience();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExperience.mutateAsync(deleteId);
      toast.success('Experience deleted');
      setDeleteId(null);
    } catch { toast.error('Failed to delete'); }
  };

  const handleDuplicate = async (exp: any) => {
    try {
      await duplicateExperience.mutateAsync({
        name: `${exp.name} (Copy)`,
        slug: `${exp.slug}-copy-${Date.now()}`,
        category: exp.category,
        description: exp.description,
        long_description: exp.long_description,
        hero_image_url: exp.hero_image_url,
        duration: exp.duration,
        price_from: exp.price_from,
        price_type: exp.price_type,
        destination_id: exp.destination_id,
        is_featured: false,
        status: 'draft',
        gallery: exp.gallery || [],
        includes: exp.includes || [],
      });
      toast.success('Experience duplicated');
    } catch { toast.error('Failed to duplicate'); }
  };

  const handleToggleActive = async (id: string, currentStatus: string) => {
    try {
      await updateExperience.mutateAsync({
        id,
        status: currentStatus === 'active' ? 'draft' : 'active',
      });
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  // Sort: active first, then name
  const sorted = experiences
    ? [...experiences].sort((a, b) => {
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
              <h1 className="text-2xl font-serif font-medium">Experiences</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {experiences?.length || 0} total · {experiences?.filter(e => e.status === 'active').length || 0} active
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Experience
            </Button>
          </div>

          <div className="card-organic overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead className="hidden lg:table-cell">Duration</TableHead>
                  <TableHead className="hidden md:table-cell">Active</TableHead>
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
                ) : sorted.length > 0 ? (
                  sorted.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {exp.hero_image_url ? (
                              <img src={exp.hero_image_url} alt="" className="w-9 h-9 object-cover" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{exp.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{exp.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{exp.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {exp.price_from ? `€${exp.price_from}` : '—'}
                        {exp.price_type ? <span className="text-xs text-muted-foreground ml-1">/{exp.price_type}</span> : null}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {exp.duration || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Switch
                          checked={exp.status === 'active'}
                          onCheckedChange={() => handleToggleActive(exp.id, exp.status)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuItem onClick={() => setEditId(exp.id)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(exp)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/experiences/${exp.slug}`, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" /> View Page
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(exp.id)} className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          </div>
        </div>

        <ExperienceFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
        <ExperienceFormDialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)} experienceId={editId || undefined} />

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Experience</AlertDialogTitle>
              <AlertDialogDescription>This will also delete related enquiries. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminExperiences;
