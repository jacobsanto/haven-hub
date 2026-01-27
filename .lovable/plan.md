

# Author Profiles Implementation Plan

## Overview
Add a dedicated blog authors system so each blog post can display the actual author's name, avatar, and bio instead of the default editorial team placeholder.

---

## Part 1: Database Schema

### Create `blog_authors` Table

A dedicated authors table separate from user profiles provides editorial flexibility - authors don't need user accounts (for guest contributors, editorial pseudonyms, etc.).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Display name (required) |
| `slug` | text | URL-friendly identifier |
| `avatar_url` | text | Profile image URL |
| `bio` | text | Short author biography |
| `email` | text | Contact email (optional) |
| `website_url` | text | Personal website (optional) |
| `social_twitter` | text | Twitter/X handle |
| `social_linkedin` | text | LinkedIn profile URL |
| `is_active` | boolean | Whether author is currently active |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### Update `blog_posts` Foreign Key

Add a foreign key relationship from `blog_posts.author_id` to `blog_authors.id`.

### RLS Policies

| Policy | Command | Rule |
|--------|---------|------|
| Anyone can view active authors | SELECT | `is_active = true` |
| Admins can view all authors | SELECT | `has_role(auth.uid(), 'admin')` |
| Admins can insert authors | INSERT | `has_role(auth.uid(), 'admin')` |
| Admins can update authors | UPDATE | `has_role(auth.uid(), 'admin')` |
| Admins can delete authors | DELETE | `has_role(auth.uid(), 'admin')` |

---

## Part 2: New Files to Create

### `src/types/blog.ts` - Add Author Type

Add `BlogAuthor` interface with all author fields.

### `src/hooks/useBlogAuthors.ts`

New hook for CRUD operations on authors:
- `useBlogAuthors()` - List all authors
- `useBlogAuthor(id)` - Get single author
- `useCreateBlogAuthor()` - Create author
- `useUpdateBlogAuthor()` - Update author
- `useDeleteBlogAuthor()` - Delete author

### `src/components/admin/BlogAuthorFormDialog.tsx`

Admin dialog for creating/editing authors with:
- Name and slug fields
- Avatar URL input
- Bio textarea
- Social links (Twitter, LinkedIn)
- Website URL
- Active status toggle

### `src/pages/admin/AdminBlogAuthors.tsx`

Admin page to manage authors:
- List all authors with avatar, name, post count
- Add/Edit/Delete actions
- Quick toggle for active status

---

## Part 3: Files to Modify

### `src/hooks/useBlogPosts.ts`

Update queries to join with `blog_authors`:
```
.select(`
  *,
  category:blog_categories(*),
  author:blog_authors(*)
`)
```

### `src/types/blog.ts`

- Add `BlogAuthor` interface
- Add `author?: BlogAuthor` to `BlogPost` interface

### `src/pages/BlogPost.tsx`

Replace hardcoded author with real data:
- Use `post.author` from the query
- Fall back to "Arivia Editorial" if no author assigned
- Pass real author data to `AuthorBio` component

### `src/components/admin/BlogPostFormDialog.tsx`

Add author selector dropdown:
- Fetch authors list using `useBlogAuthors()`
- Add `author_id` field to form schema
- Display author name with avatar in select options

### `src/components/admin/AdminLayout.tsx`

Add "Authors" link to the admin sidebar navigation.

### `src/App.tsx`

Add route for `/admin/authors` page.

---

## Part 4: Optional Enhancements

### Author Display on Blog Cards

Show small author avatar and name on:
- `BlogPostCard` - Author byline below title
- `BlogHero` - Author info in overlay
- `BlogSecondaryCard` - Compact author display

### Author Profile Page (Future)

A public `/authors/:slug` page showing:
- Author bio and avatar
- Social links
- All posts by this author

---

## Implementation Order

1. **Database Migration**
   - Create `blog_authors` table with columns and constraints
   - Add foreign key to `blog_posts`
   - Create RLS policies

2. **Types & Hooks**
   - Update `src/types/blog.ts` with author interface
   - Create `src/hooks/useBlogAuthors.ts`
   - Update `useBlogPosts.ts` to include author join

3. **Admin Interface**
   - Create `BlogAuthorFormDialog.tsx`
   - Create `AdminBlogAuthors.tsx` page
   - Add route and nav link

4. **Blog Post Admin**
   - Add author selector to `BlogPostFormDialog.tsx`

5. **Public Display**
   - Update `BlogPost.tsx` to use real author data
   - Optionally update blog cards

---

## Sample Author Data

Seed the database with a default author:

| Field | Value |
|-------|-------|
| name | Arivia Editorial |
| slug | arivia-editorial |
| bio | Our editorial team curates the finest travel insights, destination guides, and luxury living inspiration. |
| is_active | true |

---

## Technical Notes

- The `blog_authors` table is intentionally separate from `profiles` to allow non-user authors (guest writers, editorial team accounts)
- Author avatars can use the existing `property-images` bucket or a new `author-avatars` bucket
- Deleting an author with posts should set those posts' `author_id` to NULL (not cascade delete)

