import { useState } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useBlogAuthors, useDeleteBlogAuthor, useUpdateBlogAuthor } from '@/hooks/useBlogAuthors';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { BlogAuthorFormDialog } from '@/components/admin/BlogAuthorFormDialog';
import { BlogAuthor } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export default function AdminBlogAuthors() {
  const { data: authors, isLoading } = useBlogAuthors();
  const { data: allPosts } = useBlogPosts();
  const deleteAuthor = useDeleteBlogAuthor();
  const updateAuthor = useUpdateBlogAuthor();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<BlogAuthor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Count posts per author
  const getPostCount = (authorId: string) => {
    return allPosts?.filter(p => p.author_id === authorId).length || 0;
  };

  const handleEdit = (author: BlogAuthor) => {
    setEditingAuthor(author);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingAuthor(null);
    setDialogOpen(true);
  };

  const handleToggleActive = (author: BlogAuthor) => {
    updateAuthor.mutate({ id: author.id, is_active: !author.is_active });
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteAuthor.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif text-foreground">Blog Authors</h1>
              <p className="text-muted-foreground">Manage blog post authors</p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Author
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !authors?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No authors yet. Create your first author to get started.</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authors.map((author) => (
                    <TableRow key={author.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={author.avatar_url || undefined} alt={author.name} />
                            <AvatarFallback>
                              {author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{author.name}</p>
                            <p className="text-sm text-muted-foreground">{author.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{getPostCount(author.id)}</span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={author.is_active}
                          onCheckedChange={() => handleToggleActive(author)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(author)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteId(author.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <BlogAuthorFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          author={editingAuthor}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Author</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this author? Posts assigned to this author will have their author removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}
