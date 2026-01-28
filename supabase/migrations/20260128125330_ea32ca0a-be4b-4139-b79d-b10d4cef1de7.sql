-- Add inline_images column for storing section-specific images
ALTER TABLE blog_posts ADD COLUMN inline_images jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN blog_posts.inline_images IS 'Array of inline images with url, alt, caption, and position (e.g., after-heading-1)';