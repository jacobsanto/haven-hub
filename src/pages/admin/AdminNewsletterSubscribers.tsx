import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Mail, Trash2, UserX, UserCheck, Search, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useNewsletterSubscribers, useUpdateSubscriberStatus, useDeleteSubscriber } from '@/hooks/useNewsletterSubscribers';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
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

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-medium">Newsletter</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {totalCount} subscribers · {activeCount} active
              </p>
            </div>
            <Button onClick={handleExportCSV} disabled={!subscribers?.length} size="sm" variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="subscribers" className="text-xs">Subscribers</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="card-organic p-4 text-center">
                  <p className="text-2xl font-semibold">{totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="card-organic p-4 text-center">
                  <p className="text-2xl font-semibold text-primary">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="card-organic p-4 text-center">
                  <p className="text-2xl font-semibold">{totalCount - activeCount}</p>
                  <p className="text-xs text-muted-foreground">Unsubscribed</p>
                </div>
              </div>
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Campaign tracking (open %, click %, revenue) will be available when email sending is configured.</p>
              </div>
            </TabsContent>

            {/* Subscribers Tab */}
            <TabsContent value="subscribers" className="space-y-4 mt-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by email…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
              </div>

              <div className="card-organic overflow-hidden">
                {isLoading ? (
                  <AdminLoadingSkeleton variant="table" rows={5} />
                ) : filteredSubscribers.length === 0 ? (
                  <AdminEmptyState icon={Mail} title={searchQuery ? 'No match' : 'No subscribers'} description="Subscribers appear here" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden md:table-cell">Subscribed</TableHead>
                        <TableHead className="hidden md:table-cell">Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscribers.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium text-sm">{sub.email}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {format(new Date(sub.subscribed_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs capitalize">{sub.source || '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.is_active ? 'default' : 'secondary'} className="text-xs">
                              {sub.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => updateStatus.mutate({ id: sub.id, is_active: !sub.is_active })}>
                                {sub.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle>
                                    <AlertDialogDescription>Remove {sub.email} permanently.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteSubscriber.mutate(sub.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
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
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
