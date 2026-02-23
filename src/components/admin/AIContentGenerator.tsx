import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Check, RefreshCw, ChevronDown, Wand2, Target, Users, Feather, Info, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  useAIContent, 
  ContentType, 
  ToneType, 
  LengthType, 
  PersonaType,
  MarketingAngleType,
  TravelStyleType,
  DisclosureType,
  GeneratedContent,
  BlogContent,
  contentTemplates,
  personaOptions,
  marketingAngleOptions,
  travelStyleOptions,
  disclosureOptions,
  disclosureTexts,
} from '@/hooks/useAIContent';
import { cn } from '@/lib/utils';

interface ContentItem {
  id: string;
  name: string;
  existingData?: Record<string, unknown>;
}

interface AIContentGeneratorProps {
  contentType: ContentType;
  items: ContentItem[];
  onApplyContent?: (itemId: string, content: GeneratedContent) => void;
}

const contentTypeLabels: Record<ContentType, string> = {
  blog: 'Blog Post',
  destination: 'Destination',
  experience: 'Experience',
  property: 'Property',
};

const toneOptions: { value: ToneType; label: string; description: string }[] = [
  { value: 'luxury', label: 'Luxury', description: 'Sophisticated & exclusive' },
  { value: 'warm', label: 'Warm & Inviting', description: 'Friendly & personal' },
  { value: 'professional', label: 'Professional', description: 'Clear & authoritative' },
];

const lengthOptions: { value: LengthType; label: string }[] = [
  { value: 'short', label: 'Concise' },
  { value: 'medium', label: 'Balanced' },
  { value: 'long', label: 'Comprehensive' },
];

export function AIContentGenerator({ contentType, items, onApplyContent }: AIContentGeneratorProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [tone, setTone] = useState<ToneType>('luxury');
  const [length, setLength] = useState<LengthType>('medium');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTargeting, setShowTargeting] = useState(false);
  
  // Targeting state
  const [persona, setPersona] = useState<PersonaType | ''>('');
  const [marketingAngle, setMarketingAngle] = useState<MarketingAngleType | ''>('');
  const [travelStyle, setTravelStyle] = useState<TravelStyleType | ''>('');

  // Disclosure state
  const [addDisclosure, setAddDisclosure] = useState(false);
  const [disclosureType, setDisclosureType] = useState<DisclosureType>('subtle');

  // Comparison state
  const [originalContent, setOriginalContent] = useState<GeneratedContent | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [hasBeenHumanized, setHasBeenHumanized] = useState(false);

  const { generateContent, humanizeContent, isGenerating, isHumanizing, generatedContent, clearContent } = useAIContent();
  const { toast } = useToast();

  const selectedItem = useMemo(() => 
    items.find(item => item.id === selectedItemId),
    [items, selectedItemId]
  );

  const availableTemplates = useMemo(() => 
    contentTemplates.filter(t => (t.contentTypes as readonly string[]).includes(contentType)),
    [contentType]
  );

  const handleGenerate = async () => {
    if (!selectedItem) {
      toast({
        title: 'Select an item',
        description: `Please select a ${contentTypeLabels[contentType].toLowerCase()} to generate content for.`,
        variant: 'destructive',
      });
      return;
    }

    // Reset comparison state on new generation
    setOriginalContent(null);
    setShowComparison(false);
    setHasBeenHumanized(false);

    await generateContent({
      contentType,
      targetName: selectedItem.name,
      existingData: selectedItem.existingData,
      customInstructions: customInstructions || undefined,
      tone,
      length,
      template: selectedTemplate && selectedTemplate !== '_none' ? selectedTemplate : undefined,
      persona: persona || undefined,
      marketingAngle: marketingAngle || undefined,
      travelStyle: travelStyle || undefined,
    });
  };

  const handleHumanize = async () => {
    if (!generatedContent) return;
    
    // Save original before humanizing
    setOriginalContent(generatedContent);
    
    const result = await humanizeContent({
      contentType,
      contentToHumanize: generatedContent,
    });
    
    if (result) {
      setHasBeenHumanized(true);
      setShowComparison(true);
    }
  };

  const handleUseOriginal = () => {
    if (originalContent) {
      clearContent();
      // Re-set the original content as the active content
      // We need to trigger a re-generation simulation or just use the stored original
      setShowComparison(false);
      setHasBeenHumanized(false);
      // Apply the original content back
      if (selectedItemId && onApplyContent) {
        const contentWithDisclosure = applyDisclosure(originalContent);
        onApplyContent(selectedItemId, contentWithDisclosure);
        toast({
          title: 'Original Applied',
          description: `Original content has been applied to ${selectedItem?.name}.`,
        });
      }
    }
  };

  const handleUseHumanized = () => {
    setShowComparison(false);
    handleApply();
  };

  const handleCopy = async (field: string, value: string | string[]) => {
    const textToCopy = Array.isArray(value) ? value.join(', ') : value;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  // Apply disclosure text to content before saving
  const applyDisclosure = (content: GeneratedContent): GeneratedContent => {
    if (!addDisclosure || disclosureType === 'none') return content;

    const disclosureText = disclosureTexts[disclosureType];
    
    // For blog posts, append to content field
    if (contentType === 'blog' && 'content' in content) {
      const blogContent = content as BlogContent;
      if (disclosureType === 'badge') {
        return {
          ...blogContent,
          title: disclosureText + blogContent.title,
        };
      }
      return {
        ...blogContent,
        content: blogContent.content + disclosureText,
      };
    }

    // For other content types, append to long_description or description
    if ('long_description' in content) {
      return {
        ...content,
        long_description: disclosureType === 'badge' 
          ? disclosureText + content.long_description 
          : content.long_description + disclosureText,
      };
    }

    if ('description' in content) {
      return {
        ...content,
        description: disclosureType === 'badge'
          ? disclosureText + content.description
          : content.description + disclosureText,
      };
    }

    return content;
  };

  const handleApply = () => {
    if (selectedItemId && generatedContent && onApplyContent) {
      const contentWithDisclosure = applyDisclosure(generatedContent);
      onApplyContent(selectedItemId, contentWithDisclosure);
      toast({
        title: 'Content Applied',
        description: `Generated content has been applied to ${selectedItem?.name}.`,
      });
    }
  };

  const renderContentField = (label: string, field: string, value: string | string[]) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    const isLongContent = displayValue.length > 200;

    return (
      <div key={field} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(field, value)}
            className="h-7 px-2"
          >
            {copiedField === field ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <div className={cn(
          "bg-muted/50 rounded-lg p-3 text-sm",
          isLongContent && "max-h-48 overflow-y-auto"
        )}>
          {Array.isArray(value) ? (
            <div className="flex flex-wrap gap-1.5">
              {value.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{value}</p>
          )}
        </div>
      </div>
    );
  };

  const fieldLabels: Record<ContentType, Record<string, string>> = {
    blog: {
      title: 'Title',
      excerpt: 'Excerpt',
      content: 'Content',
      tags: 'Tags',
    },
    destination: {
      description: 'Short Description',
      long_description: 'Full Description',
      highlights: 'Highlights',
      best_time_to_visit: 'Best Time to Visit',
      climate: 'Climate',
    },
    experience: {
      description: 'Short Description',
      long_description: 'Full Description',
      includes: "What's Included",
    },
    property: {
      short_description: 'Short Description (Intro)',
      description: 'Full Description',
      highlights: 'Highlights',
      neighborhood_description: 'Neighborhood',
    },
  };

  const renderContentPanel = (content: GeneratedContent, prefix: string = '') => {
    const labels = fieldLabels[contentType];
    const contentObj = content as unknown as Record<string, string | string[]>;

    return (
      <div className="space-y-4">
        {Object.entries(contentObj).map(([field, value]) => 
          renderContentField(labels[field] || field, `${prefix}${field}`, value)
        )}
      </div>
    );
  };

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;
    return renderContentPanel(generatedContent);
  };

  const renderComparisonView = () => {
    if (!originalContent || !generatedContent) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Badge variant="secondary" className="text-xs">
              Original
            </Badge>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            {renderContentPanel(originalContent, 'original-')}
          </div>
        </div>

        {/* Humanized Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-primary/30">
            <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
              Humanized ✨
            </Badge>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 ring-1 ring-primary/10">
            {renderContentPanel(generatedContent, 'humanized-')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="h-5 w-5 text-primary" />
            Generate {contentTypeLabels[contentType]} Content
          </CardTitle>
          <CardDescription>
            Select a {contentTypeLabels[contentType].toLowerCase()} and customize the AI generation settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Selection */}
          <div className="space-y-2">
            <Label>Select {contentTypeLabels[contentType]}</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose a ${contentTypeLabels[contentType].toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          {availableTemplates.length > 0 && (
            <div className="space-y-2">
              <Label>Template (optional)</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
              <SelectContent>
                  <SelectItem value="_none">No template</SelectItem>
                  {availableTemplates.map(template => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tone & Length */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as ToneType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-muted-foreground text-xs ml-2">{opt.description}</span>
                      </div>
                    </SelectItem>
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
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audience & Marketing Targeting */}
          <Collapsible open={showTargeting} onOpenChange={setShowTargeting}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Audience & Marketing
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  showTargeting && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              {/* Target Persona */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Target Persona
                </Label>
                <Select value={persona} onValueChange={(v) => setPersona(v as PersonaType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select traveler type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No specific persona</SelectItem>
                    {personaOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground text-xs">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Marketing Angle */}
              <div className="space-y-2">
                <Label>Marketing Angle</Label>
                <Select value={marketingAngle} onValueChange={(v) => setMarketingAngle(v as MarketingAngleType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marketing approach..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No specific angle</SelectItem>
                    {marketingAngleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground text-xs">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <Label>Travel Style Focus</Label>
                <Select value={travelStyle} onValueChange={(v) => setTravelStyle(v as TravelStyleType | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select travel style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No specific style</SelectItem>
                    {travelStyleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground text-xs">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Custom Instructions */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>Custom Instructions</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  showAdvanced && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                placeholder="Add specific instructions for the AI (e.g., 'Focus on the sunset views' or 'Mention the private chef service')..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedItemId || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {generatedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">Generated Content</CardTitle>
                    {hasBeenHumanized && (
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="compare-toggle" className="text-sm text-muted-foreground cursor-pointer">
                          Compare
                        </Label>
                        <Switch
                          id="compare-toggle"
                          checked={showComparison}
                          onCheckedChange={setShowComparison}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerate()}
                      disabled={isGenerating || isHumanizing}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-1", isGenerating && "animate-spin")} />
                      Regenerate
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleHumanize}
                            disabled={isGenerating || isHumanizing}
                          >
                            <Feather className={cn("h-4 w-4 mr-1", isHumanizing && "animate-pulse")} />
                            {isHumanizing ? 'Humanizing...' : 'Humanize ✨'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Refine the content to sound more natural and less AI-generated</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {onApplyContent && !showComparison && (
                      <Button size="sm" onClick={handleApply}>
                        Apply to {selectedItem?.name}
                      </Button>
                    )}
                    {onApplyContent && showComparison && hasBeenHumanized && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleUseOriginal}>
                          Use Original
                        </Button>
                        <Button size="sm" onClick={handleUseHumanized}>
                          Use Humanized
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {showComparison 
                    ? "Compare the original and humanized versions, then choose which to apply."
                    : "Review and edit the generated content before applying."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {showComparison && hasBeenHumanized ? renderComparisonView() : renderGeneratedContent()}
                
                {/* Disclosure Options */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="add-disclosure" 
                      checked={addDisclosure}
                      onCheckedChange={(checked) => setAddDisclosure(checked === true)}
                    />
                    <Label htmlFor="add-disclosure" className="flex items-center gap-2 cursor-pointer">
                      Add AI disclosure
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Add a disclosure note indicating this content was created with AI assistance</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                  </div>
                  
                  {addDisclosure && (
                    <div className="ml-6 space-y-2">
                      <Select value={disclosureType} onValueChange={(v) => setDisclosureType(v as DisclosureType)}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {disclosureOptions.filter(opt => opt.value !== 'none').map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground italic">
                        Preview: {disclosureOptions.find(o => o.value === disclosureType)?.preview}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
