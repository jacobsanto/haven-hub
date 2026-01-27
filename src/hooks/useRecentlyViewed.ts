import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/types/database';

const STORAGE_KEY = 'recently_viewed_properties';
const MAX_ITEMS = 6;

interface RecentlyViewedItem {
  id: string;
  slug: string;
  name: string;
  hero_image_url: string | null;
  city: string;
  country: string;
  base_price: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  instant_booking: boolean;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedItem[];
        // Filter out items older than 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter(item => item.viewedAt > thirtyDaysAgo);
        setRecentlyViewed(filtered);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }, []);

  // Add a property to recently viewed
  const addToRecentlyViewed = useCallback((property: Property) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.id !== property.id);
      
      // Create new item
      const newItem: RecentlyViewedItem = {
        id: property.id,
        slug: property.slug,
        name: property.name,
        hero_image_url: property.hero_image_url,
        city: property.city,
        country: property.country,
        base_price: property.base_price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        max_guests: property.max_guests,
        instant_booking: property.instant_booking,
        viewedAt: Date.now(),
      };
      
      // Add to front, limit to MAX_ITEMS
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recently viewed:', error);
      }
      
      return updated;
    });
  }, []);

  // Clear all recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    hasRecentlyViewed: recentlyViewed.length > 0,
  };
}
