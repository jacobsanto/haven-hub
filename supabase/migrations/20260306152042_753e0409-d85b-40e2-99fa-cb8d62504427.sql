
ALTER TABLE properties ADD COLUMN is_featured BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN featured_sort_order INTEGER DEFAULT 0;
ALTER TABLE destinations ADD COLUMN featured_sort_order INTEGER DEFAULT 0;
