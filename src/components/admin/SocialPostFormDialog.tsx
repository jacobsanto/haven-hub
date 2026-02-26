import { useState, useEffect, useMemo } from 'react';
import { Instagram, Linkedin, Globe, Hash, Sparkles, Loader2, ChevronDown, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSocialAccounts, type SocialPlatform, getPlatformLabel } from '@/hooks/useSocialAccounts';
import { useCreateSocialPost, useUpdateSocialPost, type SocialPost, type CreateSocialPostInput } from '@/hooks/useSocialPosts';
import { PLATFORM_CHAR_LIMITS } from '@/hooks/useSocialAccounts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SocialPostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPost?: SocialPost | null;
  defaultPlatform?: SocialPlatform;
  defaultDate?: string;
}

export function SocialPostFormDialog({ open, onOpenChange, editingPost, defaultPlatform, defaultDate }: SocialPostFormDialogProps) {
  const { data: accounts } = useSocialAccounts();
  const createMutation = useCreateSocialPost();
  const updateMutation = useUpdateSocialPost();
  const { toast } = useToast();

  const [platform, setPlatform] = useState<SocialPlatform>(defaultPlatform || 'instagram');
  const [contentText, setContentText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled'>('draft');
  const [aiTopic, setAiTopic] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);

  const handleHumanize = async () => {
    if (!contentText.trim()) return;
    setIsHumanizing(true);
    try {
      const currentHashtags = hashtags
        .split(/[,\s]+/)
        .map(h => h.replace(/^#/, '').trim())
        .filter(Boolean);
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType: 'social_humanize',
          existingData: { platform, content_text: contentText, hashtags: currentHashtags },
        },
      });
      if (error) throw error;
      if (data?.content) {
        setContentText(data.content.content_text || '');
        if (data.content.hashtags?.length) {
          setHashtags(data.content.hashtags.join(', '));
        }
        toast({ title: 'Content humanized!' });
      }
    } catch (err: any) {
      toast({ title: 'Humanize failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleAIAssist = async () => {
    if (!aiTopic.trim()) return;
    setIsAIGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType: 'social_rewrite',
          existingData: { platform, content_text: aiTopic },
          tone: 'warm',
        },
      });
      if (error) throw error;
      if (data?.content) {
        setContentText(data.content.content_text || '');
        if (data.content.hashtags?.length) {
          setHashtags(data.content.hashtags.join(', '));
        }
        toast({ title: 'Content generated!' });
      }
    } catch (err: any) {
      toast({ title: 'AI generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsAIGenerating(false);
    }
  };

  useEffect(() => {
    if (editingPost) {
      setPlatform(editingPost.platform);
      setContentText(editingPost.content_text);
      setHashtags(editingPost.hashtags.join(', '));
      setAccountId(editingPost.account_id || '');
      setScheduledFor(editingPost.scheduled_for ? editingPost.scheduled_for.slice(0, 16) : '');
      setStatus(editingPost.status === 'scheduled' ? 'scheduled' : 'draft');
    } else {
      setPlatform(defaultPlatform || 'instagram');
      setContentText('');
      setHashtags('');
      setAccountId('');
      setScheduledFor(defaultDate || '');
      setStatus('draft');
    }
  }, [editingPost, open, defaultPlatform, defaultDate]);

  const filteredAccounts = useMemo(
    () => (accounts || []).filter(a => a.platform === platform && a.is_active),
    [accounts, platform]
  );

  const charLimit = PLATFORM_CHAR_LIMITS[platform];
  const charCount = contentText.length;
  const isOverLimit = charCount > charLimit;

  const handleSave = async () => {
    const parsedHashtags = hashtags
      .split(/[,\s]+/)
      .map(h => h.replace(/^#/, '').trim())
      .filter(Boolean);

    const input: CreateSocialPostInput = {
      platform,
      content_text: contentText,
      hashtags: parsedHashtags,
      account_id: accountId || null,
      status: scheduledFor && status === 'scheduled' ? 'scheduled' : 'draft',
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    };

    if (editingPost) {
      await updateMutation.mutateAsync({ id: editingPost.id, ...input });
    } else {
      await createMutation.mutateAsync(input);
    }
    onOpenChange(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPost ? 'Edit Social Post' : 'Create Social Post'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Selection */}
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter / X</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="pinterest">Pinterest</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
                <SelectItem value="google_business">Google Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          {filteredAccounts.length > 0 && (
            <div>
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {filteredAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* AI Assist */}
          <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  AI Assist
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder={`Describe what to write for ${getPlatformLabel(platform)}...`}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAIAssist} disabled={isAIGenerating || !aiTopic.trim()}>
                  {isAIGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">AI will generate content optimized for {getPlatformLabel(platform)}.</p>
            </CollapsibleContent>
          </Collapsible>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Label>Content</Label>
                {contentText.trim() && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleHumanize}
                    disabled={isHumanizing}
                    className="h-6 text-xs px-2"
                  >
                    {isHumanizing ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <User className="h-3 w-3 mr-1" />
                    )}
                    Humanize
                  </Button>
                )}
              </div>
              <span className={`text-xs ${isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                {charCount} / {charLimit}
              </span>
            </div>
            <Textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder={`Write your ${getPlatformLabel(platform)} post...`}
              rows={6}
              className={isOverLimit ? 'border-destructive' : ''}
            />
          </div>

          {/* Hashtags */}
          <div>
            <Label className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" /> Hashtags
            </Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="travel, luxury, villa (comma separated)"
            />
          </div>

          {/* Preview */}
          <div>
            <Label className="text-xs text-muted-foreground">Preview</Label>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap min-h-[60px]">
              {contentText || <span className="text-muted-foreground italic">Your post will appear here...</span>}
              {hashtags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {hashtags.split(/[,\s]+/).filter(Boolean).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">#{tag.replace(/^#/, '')}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'scheduled')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Schedule For</Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!contentText.trim() || isOverLimit || isPending}>
            {isPending ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
