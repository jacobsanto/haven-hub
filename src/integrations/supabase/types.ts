export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addons_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          max_quantity: number | null
          name: string
          price: number
          price_type: string
          property_id: string | null
          requires_lead_time_hours: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_quantity?: number | null
          name: string
          price: number
          price_type?: string
          property_id?: string | null
          requires_lead_time_hours?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          max_quantity?: number | null
          name?: string
          price?: number
          price_type?: string
          property_id?: string | null
          requires_lead_time_hours?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addons_catalog_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      amenities: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          available: boolean
          date: string
          id: string
          property_id: string
        }
        Insert: {
          available?: boolean
          date: string
          id?: string
          property_id: string
        }
        Update: {
          available?: boolean
          date?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          social_linkedin: string | null
          social_twitter: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          social_linkedin?: string | null
          social_twitter?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          social_linkedin?: string | null
          social_twitter?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          inline_images: Json | null
          is_featured: boolean
          published_at: string | null
          scheduled_publish_at: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          inline_images?: Json | null
          is_featured?: boolean
          published_at?: string | null
          scheduled_publish_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          inline_images?: Json | null
          is_featured?: boolean
          published_at?: string | null
          scheduled_publish_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_addons: {
        Row: {
          addon_id: string
          booking_id: string
          created_at: string
          guest_count: number | null
          id: string
          notes: string | null
          quantity: number
          scheduled_date: string | null
          status: string
          total_price: number
          unit_price: number
        }
        Insert: {
          addon_id: string
          booking_id: string
          created_at?: string
          guest_count?: number | null
          id?: string
          notes?: string | null
          quantity?: number
          scheduled_date?: string | null
          status?: string
          total_price: number
          unit_price: number
        }
        Update: {
          addon_id?: string
          booking_id?: string
          created_at?: string
          guest_count?: number | null
          id?: string
          notes?: string | null
          quantity?: number
          scheduled_date?: string | null
          status?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          due_date: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          payment_type: string
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_price_breakdown: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          details: Json | null
          id: string
          label: string
          line_type: string
          quantity: number | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          label: string
          line_type: string
          quantity?: number | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          label?: string
          line_type?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_price_breakdown_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          adults: number | null
          booking_reference: string | null
          cancellation_policy: string | null
          check_in: string
          check_in_time: string | null
          check_out: string
          check_out_time: string | null
          children: number | null
          created_at: string
          external_booking_id: string | null
          guest_country: string | null
          guest_email: string
          guest_name: string
          guest_phone: string | null
          guests: number
          id: string
          nights: number
          payment_status: string | null
          pms_last_error: string | null
          pms_retry_count: number
          pms_sync_status: string | null
          pms_synced_at: string | null
          property_id: string
          source: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
        }
        Insert: {
          adults?: number | null
          booking_reference?: string | null
          cancellation_policy?: string | null
          check_in: string
          check_in_time?: string | null
          check_out: string
          check_out_time?: string | null
          children?: number | null
          created_at?: string
          external_booking_id?: string | null
          guest_country?: string | null
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          guests?: number
          id?: string
          nights: number
          payment_status?: string | null
          pms_last_error?: string | null
          pms_retry_count?: number
          pms_sync_status?: string | null
          pms_synced_at?: string | null
          property_id: string
          source?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
        }
        Update: {
          adults?: number | null
          booking_reference?: string | null
          cancellation_policy?: string | null
          check_in?: string
          check_in_time?: string | null
          check_out?: string
          check_out_time?: string | null
          children?: number | null
          created_at?: string
          external_booking_id?: string | null
          guest_country?: string | null
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          guests?: number
          id?: string
          nights?: number
          payment_status?: string | null
          pms_last_error?: string | null
          pms_retry_count?: number
          pms_sync_status?: string | null
          pms_synced_at?: string | null
          property_id?: string
          source?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          accent_color: string | null
          background_color: string | null
          base_currency: string
          body_font: string | null
          brand_name: string
          brand_tagline: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          foreground_color: string | null
          heading_font: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          base_currency?: string
          body_font?: string | null
          brand_name?: string
          brand_tagline?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          foreground_color?: string | null
          heading_font?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          base_currency?: string
          body_font?: string | null
          brand_name?: string
          brand_tagline?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          foreground_color?: string | null
          heading_font?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cancellation_policies: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          rules: Json
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          rules?: Json
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      checkout_holds: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          expires_at: string
          id: string
          property_id: string
          released: boolean
          session_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          expires_at: string
          id?: string
          property_id: string
          released?: boolean
          session_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          expires_at?: string
          id?: string
          property_id?: string
          released?: boolean
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_holds_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["contact_status"]
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string
        }
        Relationships: []
      }
      coupons_promos: {
        Row: {
          applicable_properties: string[] | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          min_booking_value: number | null
          min_nights: number | null
          name: string
          stackable: boolean
          uses_count: number
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_properties?: string[] | null
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_booking_value?: number | null
          min_nights?: number | null
          name: string
          stackable?: boolean
          uses_count?: number
          valid_from: string
          valid_until: string
        }
        Update: {
          applicable_properties?: string[] | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_booking_value?: number | null
          min_nights?: number | null
          name?: string
          stackable?: boolean
          uses_count?: number
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          best_time_to_visit: string | null
          climate: string | null
          country: string
          created_at: string
          description: string | null
          gallery: string[] | null
          hero_image_url: string | null
          highlights: string[] | null
          id: string
          is_featured: boolean
          latitude: number | null
          long_description: string | null
          longitude: number | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["destination_status"]
          updated_at: string
        }
        Insert: {
          best_time_to_visit?: string | null
          climate?: string | null
          country: string
          created_at?: string
          description?: string | null
          gallery?: string[] | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          is_featured?: boolean
          latitude?: number | null
          long_description?: string | null
          longitude?: number | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["destination_status"]
          updated_at?: string
        }
        Update: {
          best_time_to_visit?: string | null
          climate?: string | null
          country?: string
          created_at?: string
          description?: string | null
          gallery?: string[] | null
          hero_image_url?: string | null
          highlights?: string[] | null
          id?: string
          is_featured?: boolean
          latitude?: number | null
          long_description?: string | null
          longitude?: number | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["destination_status"]
          updated_at?: string
        }
        Relationships: []
      }
      exchange_rates_cache: {
        Row: {
          base_currency: string
          created_at: string
          fetched_at: string
          id: string
          rates: Json
        }
        Insert: {
          base_currency?: string
          created_at?: string
          fetched_at?: string
          id?: string
          rates?: Json
        }
        Update: {
          base_currency?: string
          created_at?: string
          fetched_at?: string
          id?: string
          rates?: Json
        }
        Relationships: []
      }
      exit_intent_settings: {
        Row: {
          cooldown_days: number | null
          delay_seconds: number | null
          discount_offer_enabled: boolean | null
          discount_percent: number | null
          headline: string | null
          id: string
          is_enabled: boolean | null
          price_drop_offer_enabled: boolean | null
          subheadline: string | null
          updated_at: string | null
        }
        Insert: {
          cooldown_days?: number | null
          delay_seconds?: number | null
          discount_offer_enabled?: boolean | null
          discount_percent?: number | null
          headline?: string | null
          id?: string
          is_enabled?: boolean | null
          price_drop_offer_enabled?: boolean | null
          subheadline?: string | null
          updated_at?: string | null
        }
        Update: {
          cooldown_days?: number | null
          delay_seconds?: number | null
          discount_offer_enabled?: boolean | null
          discount_percent?: number | null
          headline?: string | null
          id?: string
          is_enabled?: boolean | null
          price_drop_offer_enabled?: boolean | null
          subheadline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      experience_enquiries: {
        Row: {
          created_at: string
          email: string
          experience_id: string
          group_size: number | null
          id: string
          message: string | null
          name: string
          phone: string | null
          preferred_date: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
        }
        Insert: {
          created_at?: string
          email: string
          experience_id: string
          group_size?: number | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          preferred_date?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
        }
        Update: {
          created_at?: string
          email?: string
          experience_id?: string
          group_size?: number | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          preferred_date?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
        }
        Relationships: [
          {
            foreignKeyName: "experience_enquiries_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          category: string
          created_at: string
          description: string | null
          destination_id: string | null
          duration: string | null
          gallery: string[] | null
          hero_image_url: string | null
          id: string
          includes: string[] | null
          is_featured: boolean
          long_description: string | null
          name: string
          price_from: number | null
          price_type: string | null
          slug: string
          status: Database["public"]["Enums"]["experience_status"]
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          destination_id?: string | null
          duration?: string | null
          gallery?: string[] | null
          hero_image_url?: string | null
          id?: string
          includes?: string[] | null
          is_featured?: boolean
          long_description?: string | null
          name: string
          price_from?: number | null
          price_type?: string | null
          slug: string
          status?: Database["public"]["Enums"]["experience_status"]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          destination_id?: string | null
          duration?: string | null
          gallery?: string[] | null
          hero_image_url?: string | null
          id?: string
          includes?: string[] | null
          is_featured?: boolean
          long_description?: string | null
          name?: string
          price_from?: number | null
          price_type?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["experience_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      fees_taxes: {
        Row: {
          amount: number
          applies_to: string
          created_at: string
          fee_type: string
          id: string
          is_active: boolean
          is_mandatory: boolean
          is_tax: boolean
          name: string
          property_id: string | null
        }
        Insert: {
          amount: number
          applies_to?: string
          created_at?: string
          fee_type: string
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          is_tax?: boolean
          name: string
          property_id?: string | null
        }
        Update: {
          amount?: number
          applies_to?: string
          created_at?: string
          fee_type?: string
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          is_tax?: boolean
          name?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_taxes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          id: string
          page_title: string | null
          path: string
          referrer: string | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_title?: string | null
          path: string
          referrer?: string | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_title?: string | null
          path?: string
          referrer?: string | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      pms_connections: {
        Row: {
          auto_sync_enabled: boolean
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          pms_name: string
          sync_interval_minutes: number
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          auto_sync_enabled?: boolean
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          pms_name: string
          sync_interval_minutes?: number
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          auto_sync_enabled?: boolean
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          pms_name?: string
          sync_interval_minutes?: number
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pms_property_map: {
        Row: {
          created_at: string
          external_property_id: string
          external_property_name: string | null
          ical_url: string | null
          id: string
          last_availability_sync_at: string | null
          last_ical_sync_at: string | null
          last_sync_at: string | null
          pms_connection_id: string
          property_id: string
          sync_enabled: boolean
        }
        Insert: {
          created_at?: string
          external_property_id: string
          external_property_name?: string | null
          ical_url?: string | null
          id?: string
          last_availability_sync_at?: string | null
          last_ical_sync_at?: string | null
          last_sync_at?: string | null
          pms_connection_id: string
          property_id: string
          sync_enabled?: boolean
        }
        Update: {
          created_at?: string
          external_property_id?: string
          external_property_name?: string | null
          ical_url?: string | null
          id?: string
          last_availability_sync_at?: string | null
          last_ical_sync_at?: string | null
          last_sync_at?: string | null
          pms_connection_id?: string
          property_id?: string
          sync_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pms_property_map_pms_connection_id_fkey"
            columns: ["pms_connection_id"]
            isOneToOne: false
            referencedRelation: "pms_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_property_map_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_raw_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          pms_connection_id: string | null
          processed: boolean
          processed_at: string | null
          source: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          pms_connection_id?: string | null
          processed?: boolean
          processed_at?: string | null
          source: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          pms_connection_id?: string | null
          processed?: boolean
          processed_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "pms_raw_events_pms_connection_id_fkey"
            columns: ["pms_connection_id"]
            isOneToOne: false
            referencedRelation: "pms_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_sync_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_summary: string | null
          id: string
          pms_connection_id: string
          records_failed: number | null
          records_processed: number | null
          started_at: string
          status: string
          sync_type: string
          trigger_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_summary?: string | null
          id?: string
          pms_connection_id: string
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string
          status?: string
          sync_type: string
          trigger_type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_summary?: string | null
          id?: string
          pms_connection_id?: string
          records_failed?: number | null
          records_processed?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pms_sync_runs_pms_connection_id_fkey"
            columns: ["pms_connection_id"]
            isOneToOne: false
            referencedRelation: "pms_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotional_campaigns: {
        Row: {
          applicable_pages: string[] | null
          applicable_properties: string[] | null
          auto_discount_percent: number | null
          coupon_id: string | null
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          description: string | null
          discount_method: string
          ends_at: string
          id: string
          image_url: string | null
          impressions_count: number | null
          is_active: boolean | null
          max_impressions: number | null
          priority: number | null
          show_on_mobile: boolean | null
          starts_at: string
          subtitle: string | null
          title: string
          trigger_delay_seconds: number | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          applicable_pages?: string[] | null
          applicable_properties?: string[] | null
          auto_discount_percent?: number | null
          coupon_id?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          discount_method?: string
          ends_at: string
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          is_active?: boolean | null
          max_impressions?: number | null
          priority?: number | null
          show_on_mobile?: boolean | null
          starts_at: string
          subtitle?: string | null
          title: string
          trigger_delay_seconds?: number | null
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          applicable_pages?: string[] | null
          applicable_properties?: string[] | null
          auto_discount_percent?: number | null
          coupon_id?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          discount_method?: string
          ends_at?: string
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          is_active?: boolean | null
          max_impressions?: number | null
          priority?: number | null
          show_on_mobile?: boolean | null
          starts_at?: string
          subtitle?: string | null
          title?: string
          trigger_delay_seconds?: number | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotional_campaigns_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons_promos"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[] | null
          base_price: number
          bathrooms: number
          bedrooms: number
          cancellation_policy: string | null
          check_in_time: string | null
          check_out_time: string | null
          city: string
          country: string
          created_at: string
          description: string | null
          destination_id: string | null
          display_name: string | null
          gallery: string[] | null
          hero_image_url: string | null
          highlights: string[]
          house_rules: string[]
          id: string
          instant_booking: boolean
          latitude: number | null
          longitude: number | null
          max_guests: number
          name: string
          nearby_attractions: Json
          neighborhood_description: string | null
          pet_policy: string | null
          postal_code: string | null
          property_type: string
          region: string | null
          rooms: Json
          slug: string
          status: Database["public"]["Enums"]["property_status"]
          timezone: string | null
          updated_at: string
          video_url: string | null
          virtual_tour_url: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city: string
          country: string
          created_at?: string
          description?: string | null
          destination_id?: string | null
          display_name?: string | null
          gallery?: string[] | null
          hero_image_url?: string | null
          highlights?: string[]
          house_rules?: string[]
          id?: string
          instant_booking?: boolean
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          name: string
          nearby_attractions?: Json
          neighborhood_description?: string | null
          pet_policy?: string | null
          postal_code?: string | null
          property_type?: string
          region?: string | null
          rooms?: Json
          slug: string
          status?: Database["public"]["Enums"]["property_status"]
          timezone?: string | null
          updated_at?: string
          video_url?: string | null
          virtual_tour_url?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          destination_id?: string | null
          display_name?: string | null
          gallery?: string[] | null
          hero_image_url?: string | null
          highlights?: string[]
          house_rules?: string[]
          id?: string
          instant_booking?: boolean
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          name?: string
          nearby_attractions?: Json
          neighborhood_description?: string | null
          pet_policy?: string | null
          postal_code?: string | null
          property_type?: string
          region?: string | null
          rooms?: Json
          slug?: string
          status?: Database["public"]["Enums"]["property_status"]
          timezone?: string | null
          updated_at?: string
          video_url?: string | null
          virtual_tour_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_plans: {
        Row: {
          base_rate: number
          cancellation_policy: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_stay: number | null
          member_tier_required: string | null
          min_stay: number
          name: string
          property_id: string
          rate_type: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          base_rate: number
          cancellation_policy?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_stay?: number | null
          member_tier_required?: string | null
          min_stay?: number
          name: string
          property_id: string
          rate_type?: string
          updated_at?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          base_rate?: number
          cancellation_policy?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_stay?: number | null
          member_tier_required?: string | null
          min_stay?: number
          name?: string
          property_id?: string
          rate_type?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_blog_posts: {
        Row: {
          author_id: string | null
          auto_publish: boolean
          category_id: string | null
          created_at: string
          error_message: string | null
          generated_post_id: string | null
          generation_settings: Json
          id: string
          processed_at: string | null
          scheduled_for: string
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          auto_publish?: boolean
          category_id?: string | null
          created_at?: string
          error_message?: string | null
          generated_post_id?: string | null
          generation_settings?: Json
          id?: string
          processed_at?: string | null
          scheduled_for: string
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          auto_publish?: boolean
          category_id?: string | null
          created_at?: string
          error_message?: string | null
          generated_post_id?: string | null
          generation_settings?: Json
          id?: string
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_blog_posts_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_rates: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          nightly_rate: number | null
          price_multiplier: number
          property_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          nightly_rate?: number | null
          price_multiplier?: number
          property_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          nightly_rate?: number | null
          price_multiplier?: number
          property_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_rates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      security_deposits: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          currency: string | null
          held_at: string | null
          id: string
          notes: string | null
          released_at: string | null
          status: string | null
          stripe_charge_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          currency?: string | null
          held_at?: string | null
          id?: string
          notes?: string | null
          released_at?: string | null
          status?: string | null
          stripe_charge_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          currency?: string | null
          held_at?: string | null
          id?: string
          notes?: string | null
          released_at?: string | null
          status?: string | null
          stripe_charge_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_deposits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      special_offers: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          property_id: string
          title: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean
          property_id: string
          title: string
          updated_at?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          property_id?: string
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      blog_authors_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          slug: string | null
          social_linkedin: string | null
          social_twitter: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          slug?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          slug?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_checkout_holds: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      blog_status: "draft" | "published" | "archived"
      booking_status: "pending" | "confirmed" | "cancelled"
      contact_status: "new" | "read" | "responded"
      destination_status: "active" | "draft"
      enquiry_status: "new" | "contacted" | "confirmed" | "cancelled"
      experience_status: "active" | "draft"
      property_status: "active" | "draft" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      blog_status: ["draft", "published", "archived"],
      booking_status: ["pending", "confirmed", "cancelled"],
      contact_status: ["new", "read", "responded"],
      destination_status: ["active", "draft"],
      enquiry_status: ["new", "contacted", "confirmed", "cancelled"],
      experience_status: ["active", "draft"],
      property_status: ["active", "draft", "archived"],
    },
  },
} as const
