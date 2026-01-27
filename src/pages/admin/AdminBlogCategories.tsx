import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useBlogCategories, useDeleteBlogCategory } from '@/hooks/useBlogCategories';
import { BlogCategoryFormDialog } from '@/components/admin/BlogCategoryFormDialog';
import { BlogCategory } from '@/types/blog';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminBlogCategories() {
  const { data: categories, isLoading } = useBlogCategories();
  const deleteCategory = useDeleteBlogCategory();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif text-foreground">Blog Categories</h1>
              <p className="text-muted-foreground">Organize your blog content</p>
            </div>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : categories && categories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Slug</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {category.slug}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {category.description || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No categories yet</p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first category
                </Button>
              </div>
            )}
          </div>
        </div>

        <BlogCategoryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={editingCategory}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete category?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Posts in this category will become uncategorized.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId) {
                    deleteCategory.mutate(deleteId);
                    setDeleteId(null);
                  }
                }}
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
