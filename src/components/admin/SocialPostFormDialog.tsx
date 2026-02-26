import { useState, useEffect, useMemo } from 'react';
import { Instagram, Linkedin, Globe, Hash, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocialAccounts, type SocialPlatform, getPlatformLabel } from '@/hooks/useSocialAccounts';
import { useCreateSocialPost, useUpdateSocialPost, type SocialPost, type CreateSocialPostInput } from '@/hooks/useSocialPosts';

const CHAR_LIMITS: Record<SocialPlatform, number> = {
  instagram: 2200,
  linkedin: 3000,
  tiktok: 2200,
  google_business: 1500,
};

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

  const [platform, setPlatform] = useState<SocialPlatform>(defaultPlatform || 'instagram');
  const [contentText, setContentText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled'>('draft');

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

  const charLimit = CHAR_LIMITS[platform];
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
                <SelectItem value="tiktok">TikTok</SelectItem>
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

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Content</Label>
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
