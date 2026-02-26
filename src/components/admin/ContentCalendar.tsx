import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, FileText, AlertCircle, CheckCircle2, Loader2, Trash2, Edit, Instagram, Linkedin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useContentCalendarData, useDeleteScheduledPost, ScheduledPost } from '@/hooks/useScheduledPosts';
import { ScheduledPostFormDialog } from './ScheduledPostFormDialog';

interface CalendarPost {
  id: string;
  title: string;
  date: Date;
  type: 'scheduled' | 'published' | 'draft' | 'failed' | 'generating' | 'social';
  category?: string;
  status?: string;
  platform?: string;
}

const statusIcons = {
  scheduled: Clock,
  pending: Clock,
  generating: Loader2,
  published: CheckCircle2,
  draft: FileText,
  review: FileText,
  failed: AlertCircle,
};

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  generating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

interface ContentCalendarProps {
  onNewPost?: () => void;
}

export function ContentCalendar({ onNewPost }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const { data: calendarData, isLoading } = useContentCalendarData(year, month);
  const deleteMutation = useDeleteScheduledPost();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const platformColors: Record<string, string> = {
    instagram: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    linkedin: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
    tiktok: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    google_business: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  };

  // Build calendar events from data
  const calendarEvents = useMemo(() => {
    const events: CalendarPost[] = [];
    
    // Add scheduled posts
    calendarData?.scheduledPosts?.forEach(post => {
      events.push({
        id: post.id,
        title: post.topic,
        date: parseISO(post.scheduled_for),
        type: post.status === 'pending' ? 'scheduled' : post.status as CalendarPost['type'],
        category: post.category?.name,
        status: post.status,
      });
    });
    
    // Add published/draft posts
    calendarData?.publishedPosts?.forEach(post => {
      const publishDate = post.scheduled_publish_at || post.published_at;
      if (publishDate) {
        events.push({
          id: post.id,
          title: post.title,
          date: parseISO(publishDate),
          type: post.status === 'published' ? 'published' : 'draft',
          category: post.category?.name,
          status: post.status,
        });
      }
    });

    // Add social posts
    calendarData?.socialPosts?.forEach(post => {
      const postDate = post.scheduled_for || post.published_at;
      if (postDate) {
        events.push({
          id: `social-${post.id}`,
          title: post.content_text.slice(0, 50) || `${post.platform} post`,
          date: parseISO(postDate),
          type: 'social',
          status: post.status,
          platform: post.platform,
        });
      }
    });
    
    return events;
  }, [calendarData]);

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, day));
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setEditingPost(null);
    setDialogOpen(true);
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setDialogOpen(true);
  };

  const handleDeletePost = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  // Get the first day of the week for the month grid
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Content Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[160px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={onNewPost || (() => { setEditingPost(null); setDialogOpen(true); })} className="ml-4">
              <Plus className="h-4 w-4 mr-1" />
              Schedule Post
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {/* Weekday headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Padding for first week */}
              {paddingDays.map((_, index) => (
                <div key={`pad-${index}`} className="bg-background p-2 min-h-[100px]" />
              ))}
              
              {/* Calendar days */}
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "bg-background p-2 min-h-[100px] relative cursor-pointer hover:bg-muted/50 transition-colors",
                      !isSameMonth(day, currentDate) && "opacity-50"
                    )}
                    onClick={() => handleDayClick(day)}
                  >
                    <span className={cn(
                      "inline-flex items-center justify-center w-6 h-6 text-sm rounded-full",
                      isCurrentDay && "bg-primary text-primary-foreground font-bold"
                    )}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        const isSocial = event.type === 'social';
                        const StatusIcon = isSocial
                          ? (event.platform === 'instagram' ? Instagram : event.platform === 'linkedin' ? Linkedin : Globe)
                          : (statusIcons[event.status as keyof typeof statusIcons] || Clock);
                        const colorClass = isSocial
                          ? (platformColors[event.platform || 'instagram'] || platformColors.instagram)
                          : (statusColors[event.status as keyof typeof statusColors] || statusColors.scheduled);
                        
                        return (
                          <TooltipProvider key={event.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "text-xs p-1 rounded truncate flex items-center gap-1",
                                    colorClass
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Only allow editing scheduled posts, not published ones
                                    const scheduledPost = calendarData?.scheduledPosts?.find(p => p.id === event.id);
                                    if (scheduledPost) {
                                      handleEditPost(scheduledPost);
                                    }
                                  }}
                                >
                                  <StatusIcon className={cn("h-3 w-3 shrink-0", event.status === 'generating' && "animate-spin")} />
                                  <span className="truncate">{event.title}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-muted-foreground capitalize">{event.status}</p>
                                  {event.category && (
                                    <p className="text-muted-foreground">{event.category}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Badge className={statusColors.scheduled}>
                  <Clock className="h-3 w-3 mr-1" />
                  Scheduled
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className={statusColors.generating}>
                  <Loader2 className="h-3 w-3 mr-1" />
                  Generating
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className={statusColors.review}>
                  <FileText className="h-3 w-3 mr-1" />
                  Review
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className={statusColors.published}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Published
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className={statusColors.failed}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className={platformColors.instagram}>
                  <Instagram className="h-3 w-3 mr-1" />
                  Instagram
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className={platformColors.linkedin}>
                  <Linkedin className="h-3 w-3 mr-1" />
                  LinkedIn
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className={platformColors.tiktok}>
                  <Globe className="h-3 w-3 mr-1" />
                  TikTok
                </Badge>
              </div>
            </div>

            {/* Upcoming Scheduled Posts List */}
            {calendarData?.scheduledPosts && calendarData.scheduledPosts.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Upcoming Scheduled Posts</h3>
                <div className="space-y-2">
                  {calendarData.scheduledPosts
                    .filter(p => p.status === 'pending')
                    .slice(0, 5)
                    .map(post => (
                      <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{post.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(post.scheduled_for), 'PPP p')}
                              {post.auto_publish && ' • Auto-publish'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditPost(post)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Scheduled Post</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this scheduled post? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <ScheduledPostFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPost={editingPost}
      />
    </Card>
  );
}
