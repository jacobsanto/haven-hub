

# Enhanced AI Content Styles & Targeting

## Overview

Expand the AI Content Generator with marketing-focused targeting options that let you tailor content to specific audiences, marketing goals, and travel preferences.

---

## New Targeting Dimensions

### 1. Traveler Personas

Target content to specific guest types:

| Persona | Description |
|---------|-------------|
| **Honeymoon Couples** | Romantic language, privacy, intimate experiences |
| **Luxury Families** | Multi-generational, kid-friendly, spacious accommodations |
| **Solo Adventurers** | Independence, local immersion, unique experiences |
| **Wellness Seekers** | Relaxation, spa, mindfulness, healthy living |
| **Celebration Groups** | Events, gatherings, milestone moments |
| **Business Travelers** | Connectivity, convenience, quiet workspaces |
| **Retirees & Empty Nesters** | Comfort, cultural depth, slower pace |

### 2. Marketing Angles

Focus content on specific psychological triggers:

| Angle | Use Case |
|-------|----------|
| **Aspirational/Dream** | Paint the ultimate lifestyle picture |
| **FOMO/Urgency** | Limited availability, seasonal moments |
| **Value Proposition** | Justify the investment, what's included |
| **Social Proof** | References to acclaim, popularity, reviews |
| **Exclusivity** | Private access, rare experiences, VIP treatment |
| **Transformation** | Life-changing moments, personal growth |

### 3. Travel Styles

Align content with guest interests:

| Style | Focus Areas |
|-------|-------------|
| **Adventure & Active** | Outdoor activities, exploration, thrills |
| **Wellness & Spa** | Relaxation, health, rejuvenation |
| **Cultural Immersion** | Local traditions, history, authentic experiences |
| **Culinary & Wine** | Food, dining, wine tours, cooking |
| **Romance & Celebration** | Special occasions, intimate moments |
| **Beach & Relaxation** | Sun, sea, laid-back vibes |

---

## Updated UI Design

The generator will have an organized settings panel:

```text
+------------------------------------------+
|  AI Content Generator                    |
+------------------------------------------+
|  Target: [Select Destination ▼]          |
|  Template: [Destination Guide ▼]         |
+------------------------------------------+
|  Style Settings                          |
|  ┌────────────────────────────────────┐  |
|  │ Tone:     [Luxury ▼]               │  |
|  │ Length:   [Balanced ▼]             │  |
|  └────────────────────────────────────┘  |
+------------------------------------------+
|  Audience & Marketing                    |
|  ┌────────────────────────────────────┐  |
|  │ Target Persona:  [Honeymoon ▼]     │  |
|  │ Marketing Angle: [Aspirational ▼]  │  |
|  │ Travel Style:    [Romance ▼]       │  |
|  └────────────────────────────────────┘  |
+------------------------------------------+
|  [Custom Instructions ▼]                 |
|  [Generate Content]                      |
+------------------------------------------+
```

---

## Implementation

### File Changes

**1. `src/hooks/useAIContent.ts`**
- Add new types: `PersonaType`, `MarketingAngleType`, `TravelStyleType`
- Extend `GenerateContentParams` with new optional fields
- Export option arrays for UI consumption

**2. `src/components/admin/AIContentGenerator.tsx`**
- Add new state for persona, marketingAngle, travelStyle
- Create "Audience & Marketing" collapsible section
- Pass new parameters to generation function

**3. `supabase/functions/generate-content/index.ts`**
- Add descriptions for each new targeting option
- Inject targeting context into system prompts
- Combine persona + angle + style for nuanced content

### Prompt Enhancement Example

When generating content for "Santorini Sunset Villa" with:
- Persona: Honeymoon Couples
- Angle: Aspirational
- Style: Romance & Celebration

The AI receives:

```text
Target Audience: Honeymoon couples seeking romantic, intimate experiences 
with privacy and special touches for celebrating their new marriage.

Marketing Angle: Create aspirational content that paints a picture of 
the ultimate dream experience, evoking desire and longing.

Travel Style Focus: Emphasize romantic elements, celebration moments, 
couples activities, and intimate experiences.
```

---

## Benefits

- **More relevant content** - Tailored to actual guest segments
- **Marketing efficiency** - Quick pivots between campaigns
- **Consistent brand voice** - Structured options vs. freeform prompts
- **A/B testing ready** - Generate variations for different audiences

