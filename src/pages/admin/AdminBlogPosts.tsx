import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPost } from '@/hooks/useBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { useBlogAuthors } from '@/hooks/useBlogAuthors';
import { BlogPostFormDialog } from '@/components/admin/BlogPostFormDialog';
import { BlogPost } from '@/types/blog';
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

export default function AdminBlogPosts() {
  const { data: posts, isLoading } = useBlogPosts();
  const { data: categories } = useBlogCategories();
  const { data: authors } = useBlogAuthors();
  const deletePost = useDeleteBlogPost();
  const updatePost = useUpdateBlogPost();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleToggleStatus = (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    updatePost.mutate({
      id: post.id,
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'published') return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Published</Badge>;
    if (status === 'draft') return <Badge variant="secondary" className="text-xs">Draft</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  const getAuthorName = (authorId: string | null) => {
    if (!authorId || !authors) return '—';
    return authors.find(a => a.id === authorId)?.name || '—';
  };

  // Sort: published first, then by date
  const sorted = posts
    ? [...posts].sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'published') return -1;
          if (b.status === 'published') return 1;
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
    : [];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-medium">Blog Posts</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {posts?.length || 0} posts · {posts?.filter(p => p.status === 'published').length || 0} published
              </p>
            </div>
            <Button onClick={() => { setEditingPost(null); setDialogOpen(true); }} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> New Post
            </Button>
          </div>

          <div className="card-organic overflow-hidden">
            {isLoading ? (
              <AdminLoadingSkeleton variant="table" rows={5} />
            ) : sorted.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Author</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{post.title}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{post.category?.name || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{post.category?.name || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{getAuthorName(post.author_id)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getStatusBadge(post.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuItem onClick={() => { setEditingPost(post); setDialogOpen(true); }}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(post)}>
                              {post.status === 'published' ? <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</> : <><Eye className="h-4 w-4 mr-2" /> Publish</>}
                            </DropdownMenuItem>
                            {post.status === 'published' && (
                              <DropdownMenuItem onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteId(post.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <AdminEmptyState
                icon={FileText}
                title="No blog posts yet"
                description="Start creating content"
                actionLabel="Create Post"
                onAction={() => { setEditingPost(null); setDialogOpen(true); }}
              />
            )}
          </div>
        </div>

        <BlogPostFormDialog open={dialogOpen} onOpenChange={setDialogOpen} post={editingPost} categories={categories || []} />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete post?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (deleteId) { deletePost.mutate(deleteId); setDeleteId(null); } }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}
