import { useState } from 'react';
import { Calendar, List, LayoutGrid } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ContentCalendar } from '@/components/admin/ContentCalendar';
import { useContentCalendarData } from '@/hooks/useScheduledPosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export default function AdminContentCalendar() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const now = new Date();
  const { data: calendarData } = useContentCalendarData(now.getFullYear(), now.getMonth());

  const allPosts = [
    ...(calendarData?.scheduledPosts?.map(p => ({
      id: p.id,
      title: p.topic,
      date: p.scheduled_for,
      status: p.status,
      channel: 'Blog',
    })) || []),
    ...(calendarData?.publishedPosts?.map(p => ({
      id: p.id,
      title: p.title,
      date: p.scheduled_publish_at || p.published_at || '',
      status: p.status,
      channel: 'Blog',
    })) || []),
    ...(calendarData?.socialPosts?.map(p => ({
      id: `social-${p.id}`,
      title: p.content_text.slice(0, 60) || `${p.platform} post`,
      date: p.scheduled_for || p.published_at || '',
      status: p.status,
      channel: p.platform === 'instagram' ? 'Instagram' : p.platform === 'linkedin' ? 'LinkedIn' : p.platform === 'tiktok' ? 'TikTok' : 'GMB',
    })) || []),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getStatusBadge = (status: string) => {
    if (status === 'published') return <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Published</Badge>;
    if (status === 'pending') return <Badge variant="secondary" className="text-xs">Scheduled</Badge>;
    if (status === 'failed') return <Badge variant="destructive" className="text-xs">Failed</Badge>;
    return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Content Calendar
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Plan and schedule content. Posts auto-generate at scheduled time.
              </p>
            </div>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" className="gap-1 h-7 text-xs"
                onClick={() => setViewMode('calendar')}>
                <LayoutGrid className="h-3.5 w-3.5" /> Calendar
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="gap-1 h-7 text-xs"
                onClick={() => setViewMode('list')}>
                <List className="h-3.5 w-3.5" /> List
              </Button>
            </div>
          </div>

          {viewMode === 'calendar' ? (
            <ContentCalendar />
          ) : (
            <div className="card-organic overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Channel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPosts.length > 0 ? allPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="text-sm">{format(parseISO(post.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-medium text-sm">{post.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{getStatusBadge(post.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{post.channel}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No scheduled content.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
