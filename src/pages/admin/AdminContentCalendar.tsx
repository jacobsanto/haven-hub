import { Calendar } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ContentCalendar } from '@/components/admin/ContentCalendar';

export default function AdminContentCalendar() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-semibold flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              Content Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan and schedule your blog content in advance. Posts will be auto-generated and published at the scheduled time.
            </p>
          </div>

          <ContentCalendar />
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
