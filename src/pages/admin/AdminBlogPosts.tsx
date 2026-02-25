import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPost } from '@/hooks/useBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { BlogPostFormDialog } from '@/components/admin/BlogPostFormDialog';
import { BlogPost } from '@/types/blog';
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


export default function AdminBlogPosts() {
  const { data: posts, isLoading } = useBlogPosts();
  const { data: categories } = useBlogCategories();
  const deletePost = useDeleteBlogPost();
  const updatePost = useUpdateBlogPost();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setDialogOpen(true);
  };

  const handleToggleStatus = (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    updatePost.mutate({
      id: post.id,
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif text-foreground">Blog Posts</h1>
              <p className="text-muted-foreground">Create and manage blog articles</p>
            </div>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {isLoading ? (
              <AdminLoadingSkeleton variant="table" rows={5} />
            ) : posts && posts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground md:hidden">
                            {post.category?.name || 'Uncategorized'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {post.category?.name || 'Uncategorized'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getStatusBadge(post.status)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {post.published_at 
                          ? format(new Date(post.published_at), 'MMM d, yyyy')
                          : '—'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(post)}
                            title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {post.status === 'published' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(post.id)}
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
              <AdminEmptyState
                icon={FileText}
                title="No blog posts yet"
                description="Start creating content for your blog"
                actionLabel="Create First Post"
                onAction={handleCreate}
              />
            )}
          </div>
        </div>

        <BlogPostFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          post={editingPost}
          categories={categories || []}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The blog post will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId) {
                    deletePost.mutate(deleteId);
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
