
# Complete Implementation Plan: Missing Pages and Features

## Executive Summary

This plan covers the implementation of all missing pages and systems for your luxury villa rental platform. The work is organized into 4 phases, progressing from simpler static pages to more complex database-driven features.

---

## Phase 1: Static Information Pages

These pages require no database changes and can be built using existing patterns.

### 1.1 About Page (`/about`)

**Purpose**: Company story, mission, and team information

**Sections**:
- Hero with brand story headline
- Our Story section with founding narrative
- Mission & Values (3-4 value cards)
- Team section with founders/key team members
- Statistics bar (years in business, properties managed, happy guests)
- Call-to-action to browse properties

**Design**: Follows existing page patterns with `PageLayout`, Framer Motion animations, and the established luxury aesthetic

---

### 1.2 Contact Page (`/contact`)

**Purpose**: Allow guests to reach out with questions

**Sections**:
- Split layout: Contact form on left, contact details on right
- Form fields: Name, Email, Phone (optional), Subject dropdown, Message
- Contact information pulled from `brand_settings` (email, phone, address)
- Optional: Embedded map placeholder (static image for now)

**Database**: New `contact_submissions` table to store form entries

**Table Schema**:
```
contact_submissions
- id (uuid)
- name (text, required)
- email (text, required)  
- phone (text, optional)
- subject (text, required)
- message (text, required)
- status (enum: new, read, responded)
- created_at (timestamp)
```

---

### 1.3 Privacy Policy & Terms of Service

**Purpose**: Legal pages required for any booking platform

**Approach**:
- `/privacy` - Privacy Policy page
- `/terms` - Terms of Service page
- Simple static content with proper legal structure
- Consistent styling with the rest of the site

---

## Phase 2: Destinations System

### 2.1 Database Schema

```
destinations
- id (uuid)
- name (text, required) - e.g., "Santorini"
- slug (text, unique, required)
- country (text, required) - e.g., "Greece"
- description (text)
- long_description (text) - Rich content
- hero_image_url (text)
- gallery (text array)
- highlights (text array) - Key selling points
- best_time_to_visit (text)
- climate (text)
- is_featured (boolean)
- status (enum: active, draft)
- created_at, updated_at (timestamps)
```

### 2.2 Destinations Listing Page (`/destinations`)

**Sections**:
- Hero with tagline "Explore Our Destinations"
- Grid of destination cards showing:
  - Hero image
  - Name and country
  - Property count for that location
  - Brief description excerpt

### 2.3 Destination Detail Page (`/destinations/:slug`)

**Sections**:
- Full-width hero image with destination name overlay
- Overview section with description
- "Highlights" section (best time to visit, climate, key features)
- Properties in this destination (filtered list from existing properties)
- Photo gallery
- Call-to-action to view all properties in this destination

### 2.4 Initial Data: Santorini

Pre-populate the destinations table with Santorini as the first entry, linking to the existing Santorini Retreat property.

---

## Phase 3: Experiences System with Enquiries

### 3.1 Database Schema

```
experiences
- id (uuid)
- name (text, required)
- slug (text, unique, required)
- description (text)
- long_description (text)
- hero_image_url (text)
- gallery (text array)
- duration (text) - e.g., "Half day", "Full day", "3 hours"
- price_from (numeric) - Starting price
- price_type (text) - "per person", "per group", "custom"
- includes (text array) - What's included
- destination_id (uuid, optional) - Link to destination
- category (text) - e.g., "Culinary", "Adventure", "Cultural", "Wellness"
- is_featured (boolean)
- status (enum: active, draft)
- created_at, updated_at (timestamps)

experience_enquiries
- id (uuid)
- experience_id (uuid, foreign key)
- name (text, required)
- email (text, required)
- phone (text, optional)
- preferred_date (date, optional)
- group_size (integer, optional)
- message (text)
- status (enum: new, contacted, confirmed, cancelled)
- created_at (timestamp)
```

### 3.2 Experiences Listing Page (`/experiences`)

**Sections**:
- Hero section with tagline
- Category filter tabs (All, Culinary, Adventure, Cultural, Wellness)
- Grid of experience cards showing:
  - Hero image
  - Name and category badge
  - Duration
  - Starting price
  - Brief description

### 3.3 Experience Detail Page (`/experiences/:slug`)

**Sections**:
- Hero image with title overlay
- Overview with full description
- Details card (duration, price, what's included)
- Photo gallery
- Enquiry form (inline or modal):
  - Name, email, phone
  - Preferred date picker
  - Group size
  - Message/special requests
- Related experiences from same category

### 3.4 Admin: Experience Management

- Add to admin sidebar: "Experiences" menu item
- `/admin/experiences` - List all experiences with CRUD operations
- `/admin/experiences/new` and `/admin/experiences/:id/edit` - Form pages
- `/admin/experience-enquiries` - View and manage enquiries

---

## Phase 4: Blog System

### 4.1 Database Schema

```
blog_categories
- id (uuid)
- name (text, required)
- slug (text, unique, required)
- description (text, optional)
- created_at (timestamp)

blog_posts
- id (uuid)
- title (text, required)
- slug (text, unique, required)
- excerpt (text) - Short preview
- content (text) - Full article content (Markdown or HTML)
- featured_image_url (text)
- category_id (uuid, foreign key)
- author_id (uuid, optional) - Link to profiles
- tags (text array)
- is_featured (boolean)
- status (enum: draft, published, archived)
- published_at (timestamp, nullable)
- created_at, updated_at (timestamps)
```

### 4.2 Blog Listing Page (`/blog`)

**Sections**:
- Hero with "Stories & Inspiration" tagline
- Featured post (large card at top)
- Category filter
- Grid of post cards showing:
  - Featured image
  - Title
  - Category badge
  - Excerpt
  - Published date
  - Read time estimate

### 4.3 Blog Post Detail Page (`/blog/:slug`)

**Sections**:
- Full-width featured image
- Title and metadata (date, category, read time)
- Full article content
- Related posts from same category
- Newsletter signup CTA (optional)

### 4.4 Admin: Blog Management

- Add to admin sidebar: "Blog" with submenu
- `/admin/blog/posts` - List all posts
- `/admin/blog/posts/new` and `/admin/blog/posts/:id/edit` - Post editor
- `/admin/blog/categories` - Manage categories

---

## Implementation Sequence

```text
Week 1: Static Pages
├── About page
├── Contact page (with contact_submissions table)
├── Privacy Policy page
└── Terms of Service page

Week 2: Destinations
├── destinations table + RLS policies
├── Destinations listing page
├── Destination detail page
├── Admin destinations management
└── Seed Santorini data

Week 3: Experiences
├── experiences + experience_enquiries tables
├── Experiences listing page
├── Experience detail page with enquiry form
├── Admin experiences management
└── Admin enquiries management

Week 4: Blog
├── blog_categories + blog_posts tables
├── Blog listing page
├── Blog post detail page
├── Admin blog management
└── Admin category management
```

---

## Technical Details

### New Database Tables Summary

| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `contact_submissions` | Store contact form entries | Public insert, admin read/update |
| `destinations` | Destination information | Public read (active), admin CRUD |
| `experiences` | Curated experiences | Public read (active), admin CRUD |
| `experience_enquiries` | Experience booking requests | Public insert, admin read/update |
| `blog_categories` | Blog organization | Public read, admin CRUD |
| `blog_posts` | Blog articles | Public read (published), admin CRUD |

### New Files to Create

**Pages (12 new files)**:
- `src/pages/About.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Destinations.tsx`
- `src/pages/DestinationDetail.tsx`
- `src/pages/Experiences.tsx`
- `src/pages/ExperienceDetail.tsx`
- `src/pages/Blog.tsx`
- `src/pages/BlogPost.tsx`
- `src/pages/admin/AdminDestinations.tsx`
- `src/pages/admin/AdminExperiences.tsx`
- `src/pages/admin/AdminExperienceEnquiries.tsx`
- `src/pages/admin/AdminBlogPosts.tsx`
- `src/pages/admin/AdminBlogCategories.tsx`

**Hooks (5 new files)**:
- `src/hooks/useDestinations.ts`
- `src/hooks/useExperiences.ts`
- `src/hooks/useExperienceEnquiries.ts`
- `src/hooks/useBlogPosts.ts`
- `src/hooks/useContactSubmissions.ts`

**Components (6 new files)**:
- `src/components/destinations/DestinationCard.tsx`
- `src/components/experiences/ExperienceCard.tsx`
- `src/components/experiences/EnquiryForm.tsx`
- `src/components/blog/BlogPostCard.tsx`
- `src/components/contact/ContactForm.tsx`

### Route Updates

Add to `src/App.tsx`:
```tsx
// Public routes
<Route path="/about" element={<About />} />
<Route path="/contact" element={<Contact />} />
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
<Route path="/destinations" element={<Destinations />} />
<Route path="/destinations/:slug" element={<DestinationDetail />} />
<Route path="/experiences" element={<Experiences />} />
<Route path="/experiences/:slug" element={<ExperienceDetail />} />
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />

// Admin routes
<Route path="/admin/destinations" element={<AdminDestinations />} />
<Route path="/admin/experiences" element={<AdminExperiences />} />
<Route path="/admin/experience-enquiries" element={<AdminExperienceEnquiries />} />
<Route path="/admin/blog/posts" element={<AdminBlogPosts />} />
<Route path="/admin/blog/categories" element={<AdminBlogCategories />} />
```

---

## Summary

This plan adds **7 public pages** and **5 admin sections** to complete your luxury villa platform:

| Category | Pages |
|----------|-------|
| Information | About, Contact, Privacy, Terms |
| Destinations | Listing, Detail |
| Experiences | Listing, Detail (with enquiry) |
| Blog | Listing, Post Detail |
| Admin | Destinations, Experiences, Enquiries, Blog Posts, Categories |

All pages will follow the existing mobile-first responsive design patterns established in the codebase, using the same component library, Framer Motion animations, and luxury aesthetic.
