import { useState } from 'react';
import { Plus, Instagram, Linkedin, Globe, Trash2, Edit, Send, Facebook, Twitter, Layers } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SocialPostFormDialog } from '@/components/admin/SocialPostFormDialog';
import { useSocialPosts, useDeleteSocialPost, useUpdateSocialPost, type SocialPost } from '@/hooks/useSocialPosts';
import { getPlatformLabel, type SocialPlatform } from '@/hooks/useSocialAccounts';

const platformIcons: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Globe,
  google_business: Globe,
  twitter: Twitter,
  reddit: Globe,
  pinterest: Globe,
  facebook: Facebook,
};

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    scheduled: { variant: 'outline', label: 'Scheduled' },
    publishing: { variant: 'default', label: 'Publishing' },
    published: { variant: 'default', label: 'Published' },
    failed: { variant: 'destructive', label: 'Failed' },
  };
  const s = map[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>;
};

export default function AdminSocialPosts() {
  const { data: posts, isLoading } = useSocialPosts();
  const deleteMutation = useDeleteSocialPost();
  const updateMutation = useUpdateSocialPost();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const navigate = useNavigate();

  const handleEdit = (post: SocialPost) => {
    setEditingPost(post);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingPost(null);
    setDialogOpen(true);
  };

  const markPublished = (id: string) => {
    updateMutation.mutate({ id, status: 'published' });
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-medium flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Social Posts
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Create, schedule, and manage social media posts.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/social-composer')}>
                <Layers className="h-4 w-4 mr-1" /> New Campaign
              </Button>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-1" /> Quick Post
              </Button>
            </div>
          </div>

          {isLoading ? (
            <AdminLoadingSkeleton variant="table" />
          ) : !posts || posts.length === 0 ? (
            <AdminEmptyState
              icon={Send}
              title="No social posts yet"
              description="Create your first social media post to start planning."
              actionLabel="Create Post"
              onAction={handleNew}
            />
          ) : (
            <div className="card-organic overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="hidden md:table-cell">Account</TableHead>
                    <TableHead className="hidden md:table-cell">Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => {
                    const Icon = platformIcons[post.platform];
                    return (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">{getPlatformLabel(post.platform)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="text-sm truncate">{post.content_text || '—'}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {post.account?.account_name || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {post.scheduled_for ? format(parseISO(post.scheduled_for), 'dd MMM yyyy HH:mm') : '—'}
                        </TableCell>
                        <TableCell>{statusBadge(post.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {post.status === 'draft' && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markPublished(post.id)}>
                                Mark Published
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(post)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(post.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <SocialPostFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingPost={editingPost}
        />
      </AdminLayout>
    </AdminGuard>
  );
}
