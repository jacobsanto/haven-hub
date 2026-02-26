import { Instagram, Linkedin, Globe, Eye, Heart, MessageSquare, Share2, TrendingUp, Facebook, Twitter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSocialAnalytics } from '@/hooks/useSocialAnalytics';
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

export function SocialAnalyticsTab() {
  const { data, isLoading } = useSocialAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!data) return null;

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Posts</p>
          <p className="text-lg font-bold mt-1">{data.totalPosts}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Eye className="h-3 w-3" /> Total Reach</p>
          <p className="text-lg font-bold mt-1">{fmt(data.totalReach)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Heart className="h-3 w-3" /> Total Engagement</p>
          <p className="text-lg font-bold mt-1">{fmt(data.totalEngagement)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Avg Engagement Rate</p>
          <p className="text-lg font-bold mt-1">{data.avgEngagementRate.toFixed(2)}%</p>
        </CardContent></Card>
      </div>

      {/* Platform Breakdown */}
      {data.platformBreakdown.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Platform Breakdown</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="text-right">Reach</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="text-right">Avg Eng %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.platformBreakdown.map(row => {
                  const Icon = platformIcons[row.platform];
                  return (
                    <TableRow key={row.platform}>
                      <TableCell className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {getPlatformLabel(row.platform)}
                      </TableCell>
                      <TableCell className="text-right text-sm">{row.posts}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(row.reach)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(row.engagement)}</TableCell>
                      <TableCell className="text-right text-sm">{row.avgEngagementRate.toFixed(2)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Posts */}
      {data.topPosts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Top Performing Posts</h3>
            <div className="space-y-3">
              {data.topPosts.slice(0, 5).map(post => {
                const Icon = platformIcons[post.platform];
                return (
                  <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.content_text}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> {post.likes}</span>
                        <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {post.comments}</span>
                        <span className="flex items-center gap-0.5"><Share2 className="h-3 w-3" /> {post.shares}</span>
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {fmt(post.reach)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{post.engagement_rate.toFixed(1)}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {data.totalPosts === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No published social posts yet. Create and publish posts to see analytics here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
