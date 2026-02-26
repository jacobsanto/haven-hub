

# Blog Post Structure Templates

## What We're Adding
Seven proven blog post structure templates based on the provided reference designs. These will be selectable when generating AI blog content, guiding the AI to produce structured posts following each template's specific pattern.

## Templates

1. **The Classic List Post** -- Numbered tips/strategies with benefit-driven title, intro (problem + benefit), subheadings per item, action items, conclusion with CTA
2. **The Beginner's Guide** -- Comprehensive intro with promise statement, topic overview with definitions/examples, detailed steps with transitions, conclusion with recap + CTA
3. **Things To Do After X** -- Visualization of scenario, raise "now what?" question, numbered steps with specific instructions, conclusion highlighting importance + best tips + CTA
4. **The Product Showdown** -- Name products being compared, intro with evaluation criteria, product overview with feature-by-feature comparison, conclusion with recommendation
5. **The Detailed Case Study** -- Specific benefit + timeframe in title, intro with relatable hero, hero background + problem story, results with data, detailed steps, conclusion with motivational CTA
6. **The How They Did It Post** -- Successful people/organizations focus, intro with opportunity overview, strategies section with approach + why it works + how to apply, conclusion encouraging action
7. **The Myth Debunker** -- Highlight myths in title, intro with attention grabber + promise, myths section with background + data + why it's wrong + what to do instead, conclusion with recap + CTA

## Technical Changes

### File 1: `src/hooks/useAIContent.ts`
- Expand the `contentTemplates` array from 4 to 11 entries
- All 7 new templates tagged with `contentTypes: ['blog']`

### File 2: `supabase/functions/generate-content/index.ts`
- Add 7 new entries to the `templatePrompts` object with detailed structural instructions matching each template pattern

### File 3: `src/components/admin/BlogPostFormDialog.tsx`
- Add a template selector dropdown inside the AI Content Assistant collapsible panel (between the Tone selector and Custom Instructions)
- Pass the selected template to `generateContent()` call

## No Changes To
- Database schema
- Blog post types
- Existing templates (destination_guide, experience_spotlight, property_showcase, seasonal_promotion)
- Blog rendering/layout components

