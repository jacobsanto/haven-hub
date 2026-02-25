import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Users, FolderOpen, Sparkles, CalendarDays } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import inner content lazily
import { Suspense, lazy } from 'react';

const BlogPostsContent = lazy(() => import('./AdminBlogPosts').then(m => ({ default: m.default })));
const BlogAuthorsContent = lazy(() => import('./AdminBlogAuthors').then(m => ({ default: m.default })));
const BlogCategoriesContent = lazy(() => import('./AdminBlogCategories').then(m => ({ default: m.default })));
const AIContentContent = lazy(() => import('./AdminAIContent').then(m => ({ default: m.default })));
const ContentCalendarContent = lazy(() => import('./AdminContentCalendar').then(m => ({ default: m.default })));

// Wrapper that strips the outer AdminLayout/AdminGuard (those pages already have them)
// Instead, we'll just link to the tabs and let each render its own page.
// Actually, for a true hub experience, use simple navigation tabs.

export default function AdminContentHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'blog';
  const navigate = useNavigate();

  const tabs = [
    { value: 'blog', label: 'Blog Posts', icon: FileText, href: '/admin/blog' },
    { value: 'authors', label: 'Authors', icon: Users, href: '/admin/blog/authors' },
    { value: 'categories', label: 'Categories', icon: FolderOpen, href: '/admin/blog/categories' },
    { value: 'ai', label: 'AI Generator', icon: Sparkles, href: '/admin/ai-content' },
    { value: 'calendar', label: 'Calendar', icon: CalendarDays, href: '/admin/content-calendar' },
  ];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-semibold flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              Content Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all content from one place — blog posts, AI generation, and scheduling.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => navigate(tab.href)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
