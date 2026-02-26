import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Instagram, Linkedin, Globe, Facebook, Twitter,
  ArrowLeft, ArrowRight, Check, Sparkles, Loader2, Clock, Save, RefreshCw, User,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  type SocialPlatform,
  getPlatformLabel,
  PLATFORM_CHAR_LIMITS,
  useSocialAccounts,
} from '@/hooks/useSocialAccounts';
import { useCreateSocialPost } from '@/hooks/useSocialPosts';
import { useCreateSocialCampaign } from '@/hooks/useSocialCampaigns';
import { useSocialOptimize, type PlatformVariant } from '@/hooks/useSocialOptimize';

const ALL_PLATFORMS: SocialPlatform[] = [
  'instagram', 'linkedin', 'twitter', 'facebook',
  'tiktok', 'pinterest', 'reddit', 'google_business',
];

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

const platformColorClasses: Record<SocialPlatform, string> = {
  instagram: 'border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/30',
  linkedin: 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30',
  twitter: 'border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/30',
  facebook: 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30',
  tiktok: 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/30',
  pinterest: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30',
  reddit: 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/30',
  google_business: 'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/30',
};

type Step = 1 | 2 | 3;

export default function AdminSocialComposer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: accounts } = useSocialAccounts();
  const createPost = useCreateSocialPost();
  const createCampaign = useCreateSocialCampaign();
  const { optimize, isOptimizing } = useSocialOptimize();

  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [coreText, setCoreText] = useState('');
  const [coreHashtags, setCoreHashtags] = useState('');
  const [tone, setTone] = useState('warm');
  const [aiTopic, setAiTopic] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [rewritingPlatform, setRewritingPlatform] = useState<SocialPlatform | null>(null);
  const [humanizingPlatform, setHumanizingPlatform] = useState<SocialPlatform | 'core' | null>(null);

  // Step 2 state
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);

  // Step 3 state
  const [variants, setVariants] = useState<PlatformVariant[]>([]);
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const parsedHashtags = coreHashtags
    .split(/[,\s]+/)
    .map(h => h.replace(/^#/, '').trim())
    .filter(Boolean);

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      toast({ title: 'Enter a topic first', variant: 'destructive' });
      return;
    }
    setIsAIGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { contentType: 'social_core', targetName: aiTopic, tone },
      });
      if (error) throw error;
      if (data?.content) {
        setCoreText(data.content.core_text || '');
        if (data.content.hashtags?.length) {
          setCoreHashtags(data.content.hashtags.join(', '));
        }
        toast({ title: 'Content generated!' });
      }
    } catch (err: any) {
      toast({ title: 'AI generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleRewriteVariant = async (platform: SocialPlatform) => {
    const variant = variants.find(v => v.platform === platform);
    if (!variant) return;
    setRewritingPlatform(platform);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType: 'social_rewrite',
          existingData: { platform, content_text: variant.content_text },
          tone,
        },
      });
      if (error) throw error;
      if (data?.content) {
        updateVariant(platform, 'content_text', data.content.content_text);
        if (data.content.hashtags?.length) {
          updateVariant(platform, 'hashtags', data.content.hashtags);
        }
        toast({ title: `${getPlatformLabel(platform)} variant rewritten` });
      }
    } catch (err: any) {
      toast({ title: 'Rewrite failed', description: err.message, variant: 'destructive' });
    } finally {
      setRewritingPlatform(null);
    }
  };

  const handleHumanize = async (target: SocialPlatform | 'core') => {
    setHumanizingPlatform(target);
    try {
      const sourceText = target === 'core' ? coreText : variants.find(v => v.platform === target)?.content_text || '';
      const sourceHashtags = target === 'core' ? parsedHashtags : variants.find(v => v.platform === target)?.hashtags || [];
      const platform = target === 'core' ? 'general' : target;

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType: 'social_humanize',
          existingData: { platform, content_text: sourceText, hashtags: sourceHashtags },
        },
      });
      if (error) throw error;
      if (data?.content) {
        if (target === 'core') {
          setCoreText(data.content.content_text || '');
          if (data.content.hashtags?.length) setCoreHashtags(data.content.hashtags.join(', '));
        } else {
          updateVariant(target, 'content_text', data.content.content_text);
          if (data.content.hashtags?.length) updateVariant(target, 'hashtags', data.content.hashtags);
        }
        toast({ title: target === 'core' ? 'Content humanized!' : `${getPlatformLabel(target)} variant humanized` });
      }
    } catch (err: any) {
      toast({ title: 'Humanize failed', description: err.message, variant: 'destructive' });
    } finally {
      setHumanizingPlatform(null);
    }
  };

  const togglePlatform = (p: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleNext = useCallback(async () => {
    if (step === 1) {
      if (!coreText.trim()) {
        toast({ title: 'Please write your core message', variant: 'destructive' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedPlatforms.length === 0) {
        toast({ title: 'Select at least one platform', variant: 'destructive' });
        return;
      }
      // Generate variants via AI
      const result = await optimize(coreText, parsedHashtags, selectedPlatforms, tone);
      setVariants(result);
      setStep(3);
    }
  }, [step, coreText, selectedPlatforms, parsedHashtags, tone, optimize, toast]);

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const updateVariant = (platform: SocialPlatform, field: 'content_text' | 'hashtags', value: string | string[]) => {
    setVariants(prev => prev.map(v =>
      v.platform === platform ? { ...v, [field]: value } : v
    ));
  };

  const handleSave = async (status: 'draft' | 'scheduled') => {
    setIsSaving(true);
    try {
      // Create campaign first
      const campaign = await createCampaign.mutateAsync({
        core_text: coreText,
        core_hashtags: parsedHashtags,
        tone,
        target_platforms: selectedPlatforms,
        status,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      });

      // Create one social_post per platform variant
      for (const variant of variants) {
        const matchingAccount = (accounts || []).find(
          a => a.platform === variant.platform && a.is_active
        );

        await createPost.mutateAsync({
          platform: variant.platform,
          content_text: variant.content_text,
          hashtags: variant.hashtags,
          account_id: matchingAccount?.id || null,
          campaign_id: campaign.id,
          core_content: coreText,
          status: scheduledFor && status === 'scheduled' ? 'scheduled' : 'draft',
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        });
      }

      toast({ title: `Campaign ${status === 'scheduled' ? 'scheduled' : 'saved as draft'}` });
      navigate('/admin/social-posts');
    } catch (err: any) {
      toast({ title: 'Failed to save campaign', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-medium">Create Campaign</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Write once, publish everywhere — optimized for each platform.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin/social-posts')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                <span className={cn('text-sm hidden sm:inline', step >= s ? 'text-foreground' : 'text-muted-foreground')}>
                  {s === 1 ? 'Core Content' : s === 2 ? 'Platforms' : 'Review & Schedule'}
                </span>
                {s < 3 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step 1: Core Content */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Write your core message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Write Panel */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Copywriter
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={aiTopic}
                      onChange={e => setAiTopic(e.target.value)}
                      placeholder="e.g. Promote our new Bali villa for summer season"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleAIGenerate}
                      disabled={isAIGenerating || !aiTopic.trim()}
                    >
                      {isAIGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1" />
                      )}
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Describe your topic and AI will draft the core message and suggest hashtags.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Core Message</Label>
                    {coreText.trim() && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleHumanize('core')}
                        disabled={humanizingPlatform === 'core'}
                        className="h-7 text-xs"
                      >
                        {humanizingPlatform === 'core' ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        Humanize
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={coreText}
                    onChange={e => setCoreText(e.target.value)}
                    placeholder="Write the main idea for your post. We'll optimize it for each platform..."
                    rows={6}
                  />
                </div>
                <div>
                  <Label>Hashtag Seeds</Label>
                  <Input
                    value={coreHashtags}
                    onChange={e => setCoreHashtags(e.target.value)}
                    placeholder="travel, luxury, villa (comma separated)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll adapt these per platform (more for Instagram, fewer for Twitter, none for Reddit).
                  </p>
                </div>
                <div>
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luxury">Luxury & Elegant</SelectItem>
                      <SelectItem value="warm">Warm & Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Platform Selection */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select target platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ALL_PLATFORMS.map(p => {
                    const Icon = platformIcons[p];
                    const isSelected = selectedPlatforms.includes(p);
                    const hasAccount = (accounts || []).some(a => a.platform === p && a.is_active);
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                          isSelected
                            ? platformColorClasses[p]
                            : 'border-border bg-card hover:bg-muted/50'
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{getPlatformLabel(p)}</span>
                        <Badge variant={hasAccount ? 'default' : 'outline'} className="text-[9px]">
                          {hasAccount ? 'Connected' : 'No account'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {PLATFORM_CHAR_LIMITS[p].toLocaleString()} chars
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review Variants */}
          {step === 3 && (
            <div className="space-y-4">
              {isOptimizing ? (
                <Card>
                  <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Optimizing content for each platform...</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {variants.map(variant => {
                    const Icon = platformIcons[variant.platform];
                    const limit = PLATFORM_CHAR_LIMITS[variant.platform];
                    const count = variant.content_text.length;
                    const over = count > limit;

                    return (
                      <Card key={variant.platform} className={cn('border-l-4', platformColorClasses[variant.platform])}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="font-medium text-sm">{getPlatformLabel(variant.platform)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRewriteVariant(variant.platform)}
                                disabled={rewritingPlatform === variant.platform}
                                className="h-7 text-xs"
                              >
                                {rewritingPlatform === variant.platform ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                )}
                                Rewrite
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleHumanize(variant.platform)}
                                disabled={humanizingPlatform === variant.platform}
                                className="h-7 text-xs"
                              >
                                {humanizingPlatform === variant.platform ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <User className="h-3 w-3 mr-1" />
                                )}
                                Humanize
                              </Button>
                              <span className={cn('text-xs', over ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                                {count} / {limit.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Textarea
                            value={variant.content_text}
                            onChange={e => updateVariant(variant.platform, 'content_text', e.target.value)}
                            rows={4}
                            className={over ? 'border-destructive' : ''}
                          />
                          <div>
                            <Label className="text-xs">Hashtags</Label>
                            <Input
                              value={variant.hashtags.join(', ')}
                              onChange={e => updateVariant(
                                variant.platform,
                                'hashtags',
                                e.target.value.split(/[,\s]+/).map(h => h.replace(/^#/, '').trim()).filter(Boolean)
                              )}
                              placeholder="Hashtags (comma separated)"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Schedule */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                        <div className="flex-1">
                          <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Schedule For (optional)</Label>
                          <Input
                            type="datetime-local"
                            value={scheduledFor}
                            onChange={e => setScheduledFor(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleSave('draft')}
                            disabled={isSaving}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Draft
                          </Button>
                          <Button
                            onClick={() => handleSave(scheduledFor ? 'scheduled' : 'draft')}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            {scheduledFor ? 'Schedule All' : 'Save All'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {step < 3 && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleNext} disabled={isOptimizing}>
                {isOptimizing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-1" />
                )}
                {step === 2 ? 'Generate Variants' : 'Next'}
              </Button>
            </div>
          )}
          {step === 3 && !isOptimizing && (
            <div className="flex justify-start">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Platforms
              </Button>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
