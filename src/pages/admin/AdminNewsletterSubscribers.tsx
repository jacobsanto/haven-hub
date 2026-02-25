import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Mail, Trash2, UserX, UserCheck, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { 
  useNewsletterSubscribers, 
  useUpdateSubscriberStatus, 
  useDeleteSubscriber 
} from '@/hooks/useNewsletterSubscribers';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminNewsletterSubscribers() {
  const { data: subscribers, isLoading } = useNewsletterSubscribers();
  const updateStatus = useUpdateSubscriberStatus();
  const deleteSubscriber = useDeleteSubscriber();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubscribers = subscribers?.filter(sub =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const activeCount = subscribers?.filter(s => s.is_active).length || 0;
  const totalCount = subscribers?.length || 0;

  const handleExportCSV = () => {
    if (!subscribers || subscribers.length === 0) return;

    const headers = ['Email', 'Subscribed Date', 'Status', 'Source'];
    const rows = subscribers.map(sub => [
      sub.email,
      format(new Date(sub.subscribed_at), 'yyyy-MM-dd HH:mm'),
      sub.is_active ? 'Active' : 'Unsubscribed',
      sub.source || 'Unknown',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    updateStatus.mutate({ id, is_active: !currentStatus });
  };

  const handleDelete = (id: string) => {
    deleteSubscriber.mutate(id);
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif text-foreground">Newsletter Subscribers</h1>
              <p className="text-muted-foreground mt-1">
                Manage your newsletter subscriber list
              </p>
            </div>
            <Button onClick={handleExportCSV} disabled={!subscribers?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Subscribers</CardDescription>
                <CardTitle className="text-3xl">{totalCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Subscribers</CardDescription>
                <CardTitle className="text-3xl text-primary">{activeCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Unsubscribed</CardDescription>
                <CardTitle className="text-3xl text-muted-foreground">{totalCount - activeCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <AdminLoadingSkeleton variant="table" rows={5} />
              ) : filteredSubscribers.length === 0 ? (
                <AdminEmptyState
                  icon={Mail}
                  title={searchQuery ? 'No subscribers match your search' : 'No subscribers yet'}
                  description="Newsletter subscribers will appear here"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(subscriber.subscribed_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {subscriber.source || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {subscriber.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Unsubscribed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(subscriber.id, subscriber.is_active)}
                              aria-label={subscriber.is_active ? 'Unsubscribe user' : 'Reactivate user'}
                            >
                              {subscriber.is_active ? (
                                <UserX className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-primary" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Delete subscriber">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete subscriber?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {subscriber.email} from your subscriber list. 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(subscriber.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
