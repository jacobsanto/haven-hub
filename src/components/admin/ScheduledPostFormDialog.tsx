import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { useBlogAuthors } from '@/hooks/useBlogAuthors';
import { useCreateScheduledPost, useUpdateScheduledPost, ScheduledPost, GenerationSettings } from '@/hooks/useScheduledPosts';
import { 
  ToneType, 
  LengthType,
  PersonaType,
  MarketingAngleType,
  TravelStyleType,
  personaOptions,
  marketingAngleOptions,
  travelStyleOptions,
} from '@/hooks/useAIContent';

interface ScheduledPostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPost?: ScheduledPost | null;
}

const toneOptions: { value: ToneType; label: string }[] = [
  { value: 'luxury', label: 'Luxury' },
  { value: 'warm', label: 'Warm & Inviting' },
  { value: 'professional', label: 'Professional' },
];

const lengthOptions: { value: LengthType; label: string }[] = [
  { value: 'short', label: 'Concise' },
  { value: 'medium', label: 'Balanced' },
  { value: 'long', label: 'Comprehensive' },
];

const timeOptions = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

export function ScheduledPostFormDialog({ open, onOpenChange, editingPost }: ScheduledPostFormDialogProps) {
  const [topic, setTopic] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [authorId, setAuthorId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [autoPublish, setAutoPublish] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Generation settings
  const [tone, setTone] = useState<ToneType>('luxury');
  const [length, setLength] = useState<LengthType>('medium');
  const [persona, setPersona] = useState<PersonaType | ''>('');
  const [marketingAngle, setMarketingAngle] = useState<MarketingAngleType | ''>('');
  const [travelStyle, setTravelStyle] = useState<TravelStyleType | ''>('');
  const [customInstructions, setCustomInstructions] = useState('');

  const { data: categories } = useBlogCategories();
  const { data: authors } = useBlogAuthors();
  const createMutation = useCreateScheduledPost();
  const updateMutation = useUpdateScheduledPost();

  const isEditing = !!editingPost;

  useEffect(() => {
    if (editingPost) {
      setTopic(editingPost.topic);
      setCategoryId(editingPost.category_id || '');
      setAuthorId(editingPost.author_id || '');
      setAutoPublish(editingPost.auto_publish);
      
      const scheduledFor = new Date(editingPost.scheduled_for);
      setScheduledDate(scheduledFor);
      setScheduledTime(format(scheduledFor, 'HH:mm'));
      
      const settings = editingPost.generation_settings;
      setTone(settings.tone || 'luxury');
      setLength(settings.length || 'medium');
      setPersona(settings.persona || '');
      setMarketingAngle(settings.marketingAngle || '');
      setTravelStyle(settings.travelStyle || '');
      setCustomInstructions(settings.customInstructions || '');
    } else {
      resetForm();
    }
  }, [editingPost, open]);

  const resetForm = () => {
    setTopic('');
    setCategoryId('');
    setAuthorId('');
    setScheduledDate(undefined);
    setScheduledTime('09:00');
    setAutoPublish(false);
    setTone('luxury');
    setLength('medium');
    setPersona('');
    setMarketingAngle('');
    setTravelStyle('');
    setCustomInstructions('');
  };

  const handleSubmit = async () => {
    if (!topic.trim() || !scheduledDate) return;

    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledFor = new Date(scheduledDate);
    scheduledFor.setHours(hours, minutes, 0, 0);

    const generationSettings: GenerationSettings = {
      tone,
      length,
      template: 'destination_guide',
      ...(persona && { persona }),
      ...(marketingAngle && { marketingAngle }),
      ...(travelStyle && { travelStyle }),
      ...(customInstructions && { customInstructions }),
    };

    const input = {
      topic: topic.trim(),
      category_id: categoryId || null,
      author_id: authorId || null,
      generation_settings: generationSettings,
      scheduled_for: scheduledFor.toISOString(),
      auto_publish: autoPublish,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id: editingPost.id, ...input });
    } else {
      await createMutation.mutateAsync(input);
    }

    onOpenChange(false);
    resetForm();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isEditing ? 'Edit Scheduled Post' : 'Schedule New Post'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the scheduled post settings.' 
              : 'Configure a blog post to be auto-generated and published at a future date.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic / Title *</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Top 10 Hidden Beaches in Santorini"
            />
          </div>

          {/* Category & Author */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No category</SelectItem>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Author</Label>
              <Select value={authorId} onValueChange={setAuthorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select author..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No author</SelectItem>
                  {authors?.filter(a => a.is_active).map(author => (
                    <SelectItem key={author.id} value={author.id}>{author.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Publish Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Publish Time</Label>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto-publish toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="auto-publish">Auto-publish when ready</Label>
              <p className="text-xs text-muted-foreground">
                {autoPublish 
                  ? 'Post will be published immediately after generation' 
                  : 'Post will be saved as draft for review'}
              </p>
            </div>
            <Switch
              id="auto-publish"
              checked={autoPublish}
              onCheckedChange={setAutoPublish}
            />
          </div>

          {/* Generation Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as ToneType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as LengthType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lengthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Targeting */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Advanced Targeting
                <span className={cn("transition-transform", showAdvanced && "rotate-180")}>▼</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label>Target Persona</Label>
                <Select value={persona} onValueChange={(v) => setPersona(v as PersonaType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select persona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No specific persona</SelectItem>
                    {personaOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marketing Angle</Label>
                <Select value={marketingAngle} onValueChange={(v) => setMarketingAngle(v as MarketingAngleType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select angle..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No specific angle</SelectItem>
                    {marketingAngleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Travel Style</Label>
                <Select value={travelStyle} onValueChange={(v) => setTravelStyle(v as TravelStyleType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No specific style</SelectItem>
                    {travelStyleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Any specific instructions for the AI..."
                  rows={2}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!topic.trim() || !scheduledDate || isPending}
          >
            {isPending ? 'Saving...' : isEditing ? 'Update' : 'Schedule Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
