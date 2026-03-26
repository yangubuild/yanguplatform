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
      ad_placements: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          is_active: boolean | null
          placement_type: string
          position: number | null
          surface_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          placement_type: string
          position?: number | null
          surface_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          placement_type?: string
          position?: number | null
          surface_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_placements_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_placements_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "public_ads_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_placements_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "public_surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ada_chats: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ada_media: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          kind: string
          metadata: Json | null
          provider: string
          storage_path: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json | null
          provider: string
          storage_path: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json | null
          provider?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ada_media_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ada_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ada_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ada_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ada_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          invited_user_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          invited_user_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          invited_user_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: []
      }
      admin_overrides: {
        Row: {
          created_at: string | null
          created_by: string
          domain_id: string | null
          enabled: boolean | null
          id: string
          org_id: string | null
          override_type: string
          reason: string | null
          surface_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          domain_id?: string | null
          enabled?: boolean | null
          id?: string
          org_id?: string | null
          override_type: string
          reason?: string | null
          surface_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          domain_id?: string | null
          enabled?: boolean | null
          id?: string
          org_id?: string | null
          override_type?: string
          reason?: string | null
          surface_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_overrides_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_overrides_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          budget_cents: number | null
          clicks: number | null
          content: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          impressions: number | null
          spent_cents: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["ad_status"]
          target_url: string
          targeting: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_cents?: number | null
          clicks?: number | null
          content?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          spent_cents?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          target_url: string
          targeting?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_cents?: number | null
          clicks?: number | null
          content?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          spent_cents?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          target_url?: string
          targeting?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agencies: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          name: string
          owner_user_id: string
          region: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          owner_user_id: string
          region?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          owner_user_id?: string
          region?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_assets: {
        Row: {
          agency_id: string | null
          asset_type: string
          created_at: string | null
          file_url: string
          id: string
          is_public: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          agency_id?: string | null
          asset_type: string
          created_at?: string | null
          file_url: string
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          agency_id?: string | null
          asset_type?: string
          created_at?: string | null
          file_url?: string
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_assets_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_contracts: {
        Row: {
          agency_id: string
          contract_url: string
          created_at: string | null
          expires_at: string | null
          id: string
          signature_data: Json | null
          signed_at: string | null
          signed_by: string | null
          status: string
        }
        Insert: {
          agency_id: string
          contract_url: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          signature_data?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
        }
        Update: {
          agency_id?: string
          contract_url?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          signature_data?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_contracts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_invitations: {
        Row: {
          agency_id: string
          commission_split_phase1: number | null
          commission_split_phase2: number | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: string
          status: string
          token: string
        }
        Insert: {
          agency_id: string
          commission_split_phase1?: number | null
          commission_split_phase2?: number | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          token?: string
        }
        Update: {
          agency_id?: string
          commission_split_phase1?: number | null
          commission_split_phase2?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_members: {
        Row: {
          agency_id: string
          id: string
          joined_at: string
          metadata: Json | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          agency_id: string
          id?: string
          joined_at?: string
          metadata?: Json | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          id?: string
          joined_at?: string
          metadata?: Json | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_notifications: {
        Row: {
          agency_id: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          recipient_user_id: string
          title: string
          type: string
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_user_id: string
          title: string
          type: string
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_user_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_notifications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_reports: {
        Row: {
          agency_id: string
          created_by: string | null
          data: Json
          file_url: string | null
          id: string
          report_date: string
          report_type: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          agency_id: string
          created_by?: string | null
          data?: Json
          file_url?: string | null
          id?: string
          report_date: string
          report_type?: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          agency_id?: string
          created_by?: string | null
          data?: Json
          file_url?: string | null
          id?: string
          report_date?: string
          report_type?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_reports_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_onboardings: {
        Row: {
          agent_id: string
          created_at: string
          description: string | null
          id: string
          input_options: Json | null
          input_type: string | null
          is_required: boolean | null
          step_order: number
          title: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          description?: string | null
          id?: string
          input_options?: Json | null
          input_type?: string | null
          is_required?: boolean | null
          step_order: number
          title: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string | null
          id?: string
          input_options?: Json | null
          input_type?: string | null
          is_required?: boolean | null
          step_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_onboardings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_tokens: number | null
          metadata: Json | null
          model: string | null
          name: string
          status: Database["public"]["Enums"]["agent_status"]
          surface_id: string | null
          system_prompt: string | null
          temperature: number | null
          tools: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          name: string
          status?: Database["public"]["Enums"]["agent_status"]
          surface_id?: string | null
          system_prompt?: string | null
          temperature?: number | null
          tools?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          name?: string
          status?: Database["public"]["Enums"]["agent_status"]
          surface_id?: string | null
          system_prompt?: string | null
          temperature?: number | null
          tools?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "public_surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_image_generations: {
        Row: {
          created_at: string
          error: string | null
          id: string
          params: Json
          prompt: string
          provider: string
          result_images: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          params?: Json
          prompt: string
          provider?: string
          result_images?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          params?: Json
          prompt?: string
          provider?: string
          result_images?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_video_generations: {
        Row: {
          created_at: string
          error: string | null
          id: string
          params: Json
          prompt: string
          provider: string
          result_videos: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          params?: Json
          prompt: string
          provider?: string
          result_videos?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          params?: Json
          prompt?: string
          provider?: string
          result_videos?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_visibility_settings: {
        Row: {
          id: string
          last_full_scan: string | null
          scan_frequency: string | null
          tracked_ai_platforms: string[] | null
          tracked_queries: string[] | null
          tracked_regions: string[] | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_full_scan?: string | null
          scan_frequency?: string | null
          tracked_ai_platforms?: string[] | null
          tracked_queries?: string[] | null
          tracked_regions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_full_scan?: string | null
          scan_frequency?: string | null
          tracked_ai_platforms?: string[] | null
          tracked_queries?: string[] | null
          tracked_regions?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_visibility_tracking: {
        Row: {
          ai_platform: string
          capability_mentioned: string[] | null
          competitors_mentioned: string[] | null
          id: string
          positioning_match: boolean | null
          query: string
          response_snippet: string | null
          sentiment: string | null
          tracked_at: string | null
          yangu_mentioned: boolean | null
          yangu_position: number | null
        }
        Insert: {
          ai_platform: string
          capability_mentioned?: string[] | null
          competitors_mentioned?: string[] | null
          id?: string
          positioning_match?: boolean | null
          query: string
          response_snippet?: string | null
          sentiment?: string | null
          tracked_at?: string | null
          yangu_mentioned?: boolean | null
          yangu_position?: number | null
        }
        Update: {
          ai_platform?: string
          capability_mentioned?: string[] | null
          competitors_mentioned?: string[] | null
          id?: string
          positioning_match?: boolean | null
          query?: string
          response_snippet?: string | null
          sentiment?: string | null
          tracked_at?: string | null
          yangu_mentioned?: boolean | null
          yangu_position?: number | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          scheduled_for: string | null
          status: string | null
          target_platforms: string[] | null
          target_roles: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_for?: string | null
          status?: string | null
          target_platforms?: string[] | null
          target_roles?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          scheduled_for?: string | null
          status?: string | null
          target_platforms?: string[] | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      app_registry: {
        Row: {
          action_type: Database["public"]["Enums"]["app_action_type"]
          app_type: Database["public"]["Enums"]["app_registry_type"]
          category: string
          connect_route: string | null
          created_at: string
          embed_url: string | null
          generate_route: string | null
          icon: string | null
          id: string
          install_route: string | null
          is_featured: boolean
          is_native_yangu: boolean
          launch_route: string | null
          long_description: string | null
          name: string
          pricing_type: Database["public"]["Enums"]["app_pricing_type"]
          provider_badge_logo: string | null
          provider_name: string
          provider_type: string
          short_description: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["app_registry_status"]
          subcategory: string | null
          supports_api_key: boolean
          supports_desktop_install: boolean
          supports_embed: boolean
          supports_oauth: boolean
          supports_web_install: boolean
          tags: string[]
          updated_at: string
          visibility: Database["public"]["Enums"]["app_visibility"]
        }
        Insert: {
          action_type?: Database["public"]["Enums"]["app_action_type"]
          app_type?: Database["public"]["Enums"]["app_registry_type"]
          category?: string
          connect_route?: string | null
          created_at?: string
          embed_url?: string | null
          generate_route?: string | null
          icon?: string | null
          id?: string
          install_route?: string | null
          is_featured?: boolean
          is_native_yangu?: boolean
          launch_route?: string | null
          long_description?: string | null
          name: string
          pricing_type?: Database["public"]["Enums"]["app_pricing_type"]
          provider_badge_logo?: string | null
          provider_name?: string
          provider_type?: string
          short_description?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["app_registry_status"]
          subcategory?: string | null
          supports_api_key?: boolean
          supports_desktop_install?: boolean
          supports_embed?: boolean
          supports_oauth?: boolean
          supports_web_install?: boolean
          tags?: string[]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["app_visibility"]
        }
        Update: {
          action_type?: Database["public"]["Enums"]["app_action_type"]
          app_type?: Database["public"]["Enums"]["app_registry_type"]
          category?: string
          connect_route?: string | null
          created_at?: string
          embed_url?: string | null
          generate_route?: string | null
          icon?: string | null
          id?: string
          install_route?: string | null
          is_featured?: boolean
          is_native_yangu?: boolean
          launch_route?: string | null
          long_description?: string | null
          name?: string
          pricing_type?: Database["public"]["Enums"]["app_pricing_type"]
          provider_badge_logo?: string | null
          provider_name?: string
          provider_type?: string
          short_description?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["app_registry_status"]
          subcategory?: string | null
          supports_api_key?: boolean
          supports_desktop_install?: boolean
          supports_embed?: boolean
          supports_oauth?: boolean
          supports_web_install?: boolean
          tags?: string[]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["app_visibility"]
        }
        Relationships: []
      }
      app_review_appeals: {
        Row: {
          admin_notes: string | null
          created_at: string
          evidence_links: string[]
          id: string
          listing_id: string
          message: string
          status: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          evidence_links?: string[]
          id?: string
          listing_id: string
          message: string
          status?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          evidence_links?: string[]
          id?: string
          listing_id?: string
          message?: string
          status?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_review_appeals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "app_store_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      app_review_runs: {
        Row: {
          created_at: string
          decision: string
          id: string
          listing_id: string
          mode: string
          reasons: Json
          reviewed_by: string | null
          score: number
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          listing_id: string
          mode: string
          reasons?: Json
          reviewed_by?: string | null
          score?: number
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          listing_id?: string
          mode?: string
          reasons?: Json
          reviewed_by?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_review_runs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "app_store_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      app_store_listings: {
        Row: {
          app_id: string
          category: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          pricing_model: string | null
          review_notes: string | null
          screenshots: string[] | null
          slug: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          pricing_model?: string | null
          review_notes?: string | null
          screenshots?: string[] | null
          slug: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          pricing_model?: string | null
          review_notes?: string | null
          screenshots?: string[] | null
          slug?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_store_listings_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user_installs: {
        Row: {
          app_id: string
          config: Json
          id: string
          installed_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          config?: Json
          id?: string
          installed_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          config?: Json
          id?: string
          installed_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_installs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "app_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approved_by: string[] | null
          created_at: string | null
          details: Json | null
          id: string
          rejected_by: string | null
          rejection_reason: string | null
          request_type: string
          requester_id: string
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string[] | null
          created_at?: string | null
          details?: Json | null
          id?: string
          rejected_by?: string | null
          rejection_reason?: string | null
          request_type: string
          requester_id: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string[] | null
          created_at?: string | null
          details?: Json | null
          id?: string
          rejected_by?: string | null
          rejection_reason?: string | null
          request_type?: string
          requester_id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_executions: {
        Row: {
          error: string | null
          executed_at: string
          id: string
          result: Json | null
          rule_id: string
          status: string
        }
        Insert: {
          error?: string | null
          executed_at?: string
          id?: string
          result?: Json | null
          rule_id: string
          status?: string
        }
        Update: {
          error?: string | null
          executed_at?: string
          id?: string
          result?: Json | null
          rule_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          name: string
          trigger_config: Json
          trigger_count: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          name: string
          trigger_config?: Json
          trigger_count?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          name?: string
          trigger_config?: Json
          trigger_count?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      avatar_training_jobs: {
        Row: {
          avatar_id: string | null
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          provider: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          provider?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          provider?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      banner_optimization_signals: {
        Row: {
          clicks_7d: number
          ctr_7d: number
          impressions_7d: number
          recommended_weight: number
          slot: string
          updated_at: string
        }
        Insert: {
          clicks_7d?: number
          ctr_7d?: number
          impressions_7d?: number
          recommended_weight?: number
          slot: string
          updated_at?: string
        }
        Update: {
          clicks_7d?: number
          ctr_7d?: number
          impressions_7d?: number
          recommended_weight?: number
          slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          created_at: string
          paypal_payer_id: string | null
          stripe_customer_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          paypal_payer_id?: string | null
          stripe_customer_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          paypal_payer_id?: string | null
          stripe_customer_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          event_id: string | null
          id: string
          payload: Json
          provider: string
          received_at: string
        }
        Insert: {
          event_id?: string | null
          id?: string
          payload?: Json
          provider: string
          received_at?: string
        }
        Update: {
          event_id?: string | null
          id?: string
          payload?: Json
          provider?: string
          received_at?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string
          provider: string
          provider_sub_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string
          provider: string
          provider_sub_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string
          provider?: string
          provider_sub_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_section_images: {
        Row: {
          id: string
          image_url: string
          section_key: string
          slot_key: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_url: string
          section_key: string
          slot_key: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          section_key?: string
          slot_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      builder_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          publish_id: string
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          publish_id: string
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          publish_id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "builder_events_publish_id_fkey"
            columns: ["publish_id"]
            isOneToOne: false
            referencedRelation: "builder_publishes"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_pages: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          slug: string
          surface_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          slug?: string
          surface_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          slug?: string
          surface_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_pages_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "builder_surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_publishes: {
        Row: {
          created_at: string
          domain_id: string
          id: string
          published_at: string | null
          published_schema: Json
          slug: string
          state: string
          surface_id: string
          unpublished_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          id?: string
          published_at?: string | null
          published_schema?: Json
          slug?: string
          state?: string
          surface_id: string
          unpublished_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          id?: string
          published_at?: string | null
          published_schema?: Json
          slug?: string
          state?: string
          surface_id?: string
          unpublished_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_publishes_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_publishes_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "builder_surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_sections: {
        Row: {
          core_slot: string | null
          created_at: string
          id: string
          is_visible: boolean
          page_id: string
          position: number
          schema: Json
          section_type: string
          updated_at: string
        }
        Insert: {
          core_slot?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id: string
          position?: number
          schema?: Json
          section_type: string
          updated_at?: string
        }
        Update: {
          core_slot?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id?: string
          position?: number
          schema?: Json
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "builder_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_surfaces: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          favicon_url: string | null
          id: string
          metadata: Json
          org_id: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          surface_type: Database["public"]["Enums"]["builder_surface_type"]
          theme: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          metadata?: Json
          org_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          surface_type: Database["public"]["Enums"]["builder_surface_type"]
          theme?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          metadata?: Json
          org_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          surface_type?: Database["public"]["Enums"]["builder_surface_type"]
          theme?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_surfaces_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_code: string
          certificate_type: string
          course_id: string | null
          expires_at: string | null
          id: string
          issued_at: string
          metadata: Json
          status: string
          title: string
          track_id: string | null
          user_id: string
        }
        Insert: {
          certificate_code: string
          certificate_type: string
          course_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          metadata?: Json
          status?: string
          title: string
          track_id?: string | null
          user_id: string
        }
        Update: {
          certificate_code?: string
          certificate_type?: string
          course_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          metadata?: Json
          status?: string
          title?: string
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_group_read_cursors: {
        Row: {
          group_id: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_group_read_cursors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_labels: {
        Row: {
          created_at: string
          id: string
          label: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          target_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_list_members: {
        Row: {
          added_at: string
          id: string
          list_id: string
          member_group_id: string | null
          member_user_id: string | null
        }
        Insert: {
          added_at?: string
          id?: string
          list_id: string
          member_group_id?: string | null
          member_user_id?: string | null
        }
        Update: {
          added_at?: string
          id?: string
          list_id?: string
          member_group_id?: string | null
          member_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "chat_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_list_members_member_group_id_fkey"
            columns: ["member_group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          agency_id: string
          amount_cents: number
          currency: string
          id: string
          member_user_id: string
          paid_at: string | null
          payout_id: string | null
          phase: string
          referral_id: string | null
          status: string
          triggered_at: string
        }
        Insert: {
          agency_id: string
          amount_cents?: number
          currency?: string
          id?: string
          member_user_id: string
          paid_at?: string | null
          payout_id?: string | null
          phase?: string
          referral_id?: string | null
          status?: string
          triggered_at?: string
        }
        Update: {
          agency_id?: string
          amount_cents?: number
          currency?: string
          id?: string
          member_user_id?: string
          paid_at?: string | null
          payout_id?: string | null
          phase?: string
          referral_id?: string | null
          status?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      community_listings: {
        Row: {
          id: string
          listed_at: string
          status: string
          surface_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          listed_at?: string
          status?: string
          surface_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          listed_at?: string
          status?: string
          surface_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_listings_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: true
            referencedRelation: "surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      community_promotions: {
        Row: {
          category_key: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          section: string
          starts_at: string
          surface_id: string
          tier: number
          updated_at: string
        }
        Insert: {
          category_key?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          section: string
          starts_at?: string
          surface_id: string
          tier?: number
          updated_at?: string
        }
        Update: {
          category_key?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          section?: string
          starts_at?: string
          surface_id?: string
          tier?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_promotions_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      community_surface_stats: {
        Row: {
          clicks_7d: number
          clicks_total: number
          surface_id: string
          updated_at: string
        }
        Insert: {
          clicks_7d?: number
          clicks_total?: number
          surface_id: string
          updated_at?: string
        }
        Update: {
          clicks_7d?: number
          clicks_total?: number
          surface_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_surface_stats_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: true
            referencedRelation: "surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_benchmark: {
        Row: {
          category: string
          competitor_name: string
          id: string
          last_tracked_at: string | null
          mention_count: number | null
          positioning_overlap: string[] | null
          region: string | null
          sentiment_score: number | null
        }
        Insert: {
          category: string
          competitor_name: string
          id?: string
          last_tracked_at?: string | null
          mention_count?: number | null
          positioning_overlap?: string[] | null
          region?: string | null
          sentiment_score?: number | null
        }
        Update: {
          category?: string
          competitor_name?: string
          id?: string
          last_tracked_at?: string | null
          mention_count?: number | null
          positioning_overlap?: string[] | null
          region?: string | null
          sentiment_score?: number | null
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          agency_id: string
          asset_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          platform: string
          scheduled_for: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          asset_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          platform: string
          scheduled_for: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          asset_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          platform?: string
          scheduled_for?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "agency_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      content_gap_recommendations: {
        Row: {
          ai_platform: string | null
          capability_category: string | null
          created_at: string | null
          gap_description: string
          id: string
          query: string
          recommended_content_type: string | null
          recommended_title: string | null
          status: string | null
          target_region: string | null
        }
        Insert: {
          ai_platform?: string | null
          capability_category?: string | null
          created_at?: string | null
          gap_description: string
          id?: string
          query: string
          recommended_content_type?: string | null
          recommended_title?: string | null
          status?: string | null
          target_region?: string | null
        }
        Update: {
          ai_platform?: string | null
          capability_category?: string | null
          created_at?: string | null
          gap_description?: string
          id?: string
          query?: string
          recommended_content_type?: string | null
          recommended_title?: string | null
          status?: string | null
          target_region?: string | null
        }
        Relationships: []
      }
      creatify_templates: {
        Row: {
          aspect_ratio: string | null
          fetched_at: string
          id: string
          metadata: Json | null
          name: string
          preview_url: string | null
          updated_at: string
        }
        Insert: {
          aspect_ratio?: string | null
          fetched_at?: string
          id: string
          metadata?: Json | null
          name: string
          preview_url?: string | null
          updated_at?: string
        }
        Update: {
          aspect_ratio?: string | null
          fetched_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          preview_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_payment_profiles: {
        Row: {
          creator_id: string
          id: string
          methods: Json
          updated_at: string
        }
        Insert: {
          creator_id: string
          id?: string
          methods?: Json
          updated_at?: string
        }
        Update: {
          creator_id?: string
          id?: string
          methods?: Json
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      department_reports: {
        Row: {
          blockers: string[] | null
          created_at: string | null
          created_by: string | null
          data: Json | null
          department: string
          highlights: string[] | null
          id: string
          report_date: string
          summary: string | null
        }
        Insert: {
          blockers?: string[] | null
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          department: string
          highlights?: string[] | null
          id?: string
          report_date: string
          summary?: string | null
        }
        Update: {
          blockers?: string[] | null
          created_at?: string | null
          created_by?: string | null
          data?: Json | null
          department?: string
          highlights?: string[] | null
          id?: string
          report_date?: string
          summary?: string | null
        }
        Relationships: []
      }
      developer_api_quota_config: {
        Row: {
          daily_limit: number
          is_enabled: boolean
          monthly_limit: number
          quota_key: string
        }
        Insert: {
          daily_limit: number
          is_enabled?: boolean
          monthly_limit: number
          quota_key: string
        }
        Update: {
          daily_limit?: number
          is_enabled?: boolean
          monthly_limit?: number
          quota_key?: string
        }
        Relationships: []
      }
      developer_api_usage_daily: {
        Row: {
          app_id: string
          created_at: string
          date: string
          developer_id: string
          endpoint: string
          error_count: number
          id: string
          success_count: number
          total_count: number
          total_latency_ms: number
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          date: string
          developer_id: string
          endpoint: string
          error_count?: number
          id?: string
          success_count?: number
          total_count?: number
          total_latency_ms?: number
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          date?: string
          developer_id?: string
          endpoint?: string
          error_count?: number
          id?: string
          success_count?: number
          total_count?: number
          total_latency_ms?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_api_usage_daily_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_app_installs: {
        Row: {
          id: string
          installed_at: string
          installed_by: string
          listing_id: string
          org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          installed_at?: string
          installed_by: string
          listing_id: string
          org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          installed_at?: string
          installed_by?: string
          listing_id?: string
          org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_app_installs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "app_store_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_app_installs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_app_key_verify_log: {
        Row: {
          app_id: string | null
          created_at: string
          environment: string | null
          failure_reason: string | null
          id: string
          success: boolean
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          environment?: string | null
          failure_reason?: string | null
          id?: string
          success?: boolean
        }
        Update: {
          app_id?: string | null
          created_at?: string
          environment?: string | null
          failure_reason?: string | null
          id?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "developer_app_key_verify_log_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_app_keys: {
        Row: {
          app_id: string
          created_at: string
          environment: string
          id: string
          key_hash: string
          prefix: string
          revoked_at: string | null
        }
        Insert: {
          app_id: string
          created_at?: string
          environment?: string
          id?: string
          key_hash: string
          prefix: string
          revoked_at?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string
          environment?: string
          id?: string
          key_hash?: string
          prefix?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_app_keys_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_app_oauth: {
        Row: {
          app_id: string
          created_at: string
          redirect_uris: string[] | null
          scopes: string[] | null
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          redirect_uris?: string[] | null
          scopes?: string[] | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          redirect_uris?: string[] | null
          scopes?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_app_oauth_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_app_quota_overrides: {
        Row: {
          app_id: string
          daily_limit: number | null
          id: string
          monthly_limit: number | null
          quota_key: string
        }
        Insert: {
          app_id: string
          daily_limit?: number | null
          id?: string
          monthly_limit?: number | null
          quota_key: string
        }
        Update: {
          app_id?: string
          daily_limit?: number | null
          id?: string
          monthly_limit?: number | null
          quota_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_app_quota_overrides_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_app_quota_overrides_quota_key_fkey"
            columns: ["quota_key"]
            isOneToOne: false
            referencedRelation: "developer_api_quota_config"
            referencedColumns: ["quota_key"]
          },
        ]
      }
      developer_app_scopes: {
        Row: {
          app_id: string
          granted_at: string | null
          granted_by: string | null
          notes: string | null
          scope_key: string
          status: string
        }
        Insert: {
          app_id: string
          granted_at?: string | null
          granted_by?: string | null
          notes?: string | null
          scope_key: string
          status?: string
        }
        Update: {
          app_id?: string
          granted_at?: string | null
          granted_by?: string | null
          notes?: string | null
          scope_key?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_app_scopes_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_app_scopes_scope_key_fkey"
            columns: ["scope_key"]
            isOneToOne: false
            referencedRelation: "developer_scope_registry"
            referencedColumns: ["scope_key"]
          },
        ]
      }
      developer_app_webhooks: {
        Row: {
          app_id: string
          created_at: string
          events: string[] | null
          id: string
          is_active: boolean
          secret_hash: string | null
          updated_at: string
          url: string
        }
        Insert: {
          app_id: string
          created_at?: string
          events?: string[] | null
          id?: string
          is_active?: boolean
          secret_hash?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          app_id?: string
          created_at?: string
          events?: string[] | null
          id?: string
          is_active?: boolean
          secret_hash?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_app_webhooks_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_apps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          owner_user_id: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          owner_user_id: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          owner_user_id?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_apps_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_provider_permissions: {
        Row: {
          app_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean
          provider_key: string
        }
        Insert: {
          app_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          provider_key: string
        }
        Update: {
          app_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          provider_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_provider_permissions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_provider_permissions_provider_key_fkey"
            columns: ["provider_key"]
            isOneToOne: false
            referencedRelation: "provider_registry"
            referencedColumns: ["provider_key"]
          },
        ]
      }
      developer_rate_limit_config: {
        Row: {
          app_id: string
          bucket_key: string
          created_at: string
          id: string
          max_requests: number
          updated_at: string
          window_seconds: number
        }
        Insert: {
          app_id: string
          bucket_key?: string
          created_at?: string
          id?: string
          max_requests?: number
          updated_at?: string
          window_seconds?: number
        }
        Update: {
          app_id?: string
          bucket_key?: string
          created_at?: string
          id?: string
          max_requests?: number
          updated_at?: string
          window_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "developer_rate_limit_config_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_rate_limit_counters: {
        Row: {
          app_id: string
          bucket_key: string
          id: string
          request_count: number
          window_start: string
        }
        Insert: {
          app_id: string
          bucket_key?: string
          id?: string
          request_count?: number
          window_start: string
        }
        Update: {
          app_id?: string
          bucket_key?: string
          id?: string
          request_count?: number
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_rate_limit_counters_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_runtime_audit: {
        Row: {
          action: string
          app_id: string
          created_at: string
          details: Json | null
          id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          app_id: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          app_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_runtime_audit_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_scope_registry: {
        Row: {
          category: string
          created_at: string
          description: string
          is_enabled: boolean
          requires_review: boolean
          risk_level: string
          scope_key: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          is_enabled?: boolean
          requires_review?: boolean
          risk_level: string
          scope_key: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          is_enabled?: boolean
          requires_review?: boolean
          risk_level?: string
          scope_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      developer_surface_installs: {
        Row: {
          config: Json
          created_at: string
          id: string
          install_id: string
          status: string
          surface_id: string
          updated_at: string
          widget_key: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          install_id: string
          status?: string
          surface_id: string
          updated_at?: string
          widget_key: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          install_id?: string
          status?: string
          surface_id?: string
          updated_at?: string
          widget_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_surface_installs_install_id_fkey"
            columns: ["install_id"]
            isOneToOne: false
            referencedRelation: "developer_app_installs"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_webhook_deliveries: {
        Row: {
          app_id: string
          completed_at: string | null
          created_at: string
          event_type: string
          http_status: number | null
          id: string
          next_retry_at: string | null
          request_body: Json | null
          response_body: string | null
          retry_count: number
          status: string
          webhook_id: string | null
        }
        Insert: {
          app_id: string
          completed_at?: string | null
          created_at?: string
          event_type: string
          http_status?: number | null
          id?: string
          next_retry_at?: string | null
          request_body?: Json | null
          response_body?: string | null
          retry_count?: number
          status?: string
          webhook_id?: string | null
        }
        Update: {
          app_id?: string
          completed_at?: string | null
          created_at?: string
          event_type?: string
          http_status?: number | null
          id?: string
          next_retry_at?: string | null
          request_body?: Json | null
          response_body?: string | null
          retry_count?: number
          status?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_webhook_deliveries_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "developer_app_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_widget_registry: {
        Row: {
          allowed_events: string[] | null
          app_id: string
          created_at: string
          default_dimensions: Json | null
          description: string | null
          id: string
          iframe_url: string
          is_enabled: boolean
          title: string
          updated_at: string
          widget_key: string
        }
        Insert: {
          allowed_events?: string[] | null
          app_id: string
          created_at?: string
          default_dimensions?: Json | null
          description?: string | null
          id?: string
          iframe_url: string
          is_enabled?: boolean
          title: string
          updated_at?: string
          widget_key: string
        }
        Update: {
          allowed_events?: string[] | null
          app_id?: string
          created_at?: string
          default_dimensions?: Json | null
          description?: string | null
          id?: string
          iframe_url?: string
          is_enabled?: boolean
          title?: string
          updated_at?: string
          widget_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_widget_registry_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_widget_tokens: {
        Row: {
          app_id: string
          created_at: string
          expires_at: string
          id: string
          install_id: string
          org_id: string
          surface_id: string
          token: string
          widget_key: string
        }
        Insert: {
          app_id: string
          created_at?: string
          expires_at: string
          id?: string
          install_id: string
          org_id: string
          surface_id: string
          token: string
          widget_key: string
        }
        Update: {
          app_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          install_id?: string
          org_id?: string
          surface_id?: string
          token?: string
          widget_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_widget_tokens_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_widget_tokens_install_id_fkey"
            columns: ["install_id"]
            isOneToOne: false
            referencedRelation: "developer_app_installs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_widget_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      discovery_events: {
        Row: {
          created_at: string
          entity_id: string
          event_type: string
          id: string
          session_id: string | null
          surface: string
          trust_band: string | null
          visibility_tier: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          event_type: string
          id?: string
          session_id?: string | null
          surface: string
          trust_band?: string | null
          visibility_tier?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          event_type?: string
          id?: string
          session_id?: string | null
          surface?: string
          trust_band?: string | null
          visibility_tier?: string | null
        }
        Relationships: []
      }
      dm_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_health_checks: {
        Row: {
          checked_at: string | null
          domain: string
          error_message: string | null
          error_rate: number | null
          id: string
          response_time_ms: number | null
          status: string
        }
        Insert: {
          checked_at?: string | null
          domain: string
          error_message?: string | null
          error_rate?: number | null
          id?: string
          response_time_ms?: number | null
          status?: string
        }
        Update: {
          checked_at?: string | null
          domain?: string
          error_message?: string | null
          error_rate?: number | null
          id?: string
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string | null
          domain_type: string
          host: string
          id: string
          is_active: boolean | null
          kind: string
          owner_org_id: string | null
          platform_key: string | null
          points_to_surface_publish_id: string | null
        }
        Insert: {
          created_at?: string | null
          domain_type: string
          host: string
          id?: string
          is_active?: boolean | null
          kind: string
          owner_org_id?: string | null
          platform_key?: string | null
          points_to_surface_publish_id?: string | null
        }
        Update: {
          created_at?: string | null
          domain_type?: string
          host?: string
          id?: string
          is_active?: boolean | null
          kind?: string
          owner_org_id?: string | null
          platform_key?: string | null
          points_to_surface_publish_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domains_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domains_points_to_surface_publish_id_fkey"
            columns: ["points_to_surface_publish_id"]
            isOneToOne: false
            referencedRelation: "surface_publishes"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dropship_connections: {
        Row: {
          connection_status: string
          created_at: string
          id: string
          metadata: Json
          org_id: string
          provider_key: string
        }
        Insert: {
          connection_status?: string
          created_at?: string
          id?: string
          metadata?: Json
          org_id: string
          provider_key: string
        }
        Update: {
          connection_status?: string
          created_at?: string
          id?: string
          metadata?: Json
          org_id?: string
          provider_key?: string
        }
        Relationships: []
      }
      dropship_imports: {
        Row: {
          created_at: string
          display_currency: string | null
          display_price_cents: number | null
          external_product_id: string
          fx_rate: number | null
          fx_rate_timestamp: string | null
          id: string
          images: Json | null
          last_error: string | null
          last_synced_at: string | null
          provider_currency: string | null
          provider_key: string
          provider_price_cents: number | null
          raw: Json | null
          shop_surface_id: string
          sync_attempts: number
          sync_status: string
          title: string
          variants: Json | null
        }
        Insert: {
          created_at?: string
          display_currency?: string | null
          display_price_cents?: number | null
          external_product_id: string
          fx_rate?: number | null
          fx_rate_timestamp?: string | null
          id?: string
          images?: Json | null
          last_error?: string | null
          last_synced_at?: string | null
          provider_currency?: string | null
          provider_key: string
          provider_price_cents?: number | null
          raw?: Json | null
          shop_surface_id: string
          sync_attempts?: number
          sync_status?: string
          title: string
          variants?: Json | null
        }
        Update: {
          created_at?: string
          display_currency?: string | null
          display_price_cents?: number | null
          external_product_id?: string
          fx_rate?: number | null
          fx_rate_timestamp?: string | null
          id?: string
          images?: Json | null
          last_error?: string | null
          last_synced_at?: string | null
          provider_currency?: string | null
          provider_key?: string
          provider_price_cents?: number | null
          raw?: Json | null
          shop_surface_id?: string
          sync_attempts?: number
          sync_status?: string
          title?: string
          variants?: Json | null
        }
        Relationships: []
      }
      dropship_order_items: {
        Row: {
          created_at: string
          currency: string
          dropship_order_id: string
          external_product_id: string
          external_variant_id: string
          id: string
          product_title: string
          quantity: number
          sku: string | null
          unit_price_cents: number
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          dropship_order_id: string
          external_product_id: string
          external_variant_id: string
          id?: string
          product_title?: string
          quantity?: number
          sku?: string | null
          unit_price_cents?: number
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          dropship_order_id?: string
          external_product_id?: string
          external_variant_id?: string
          id?: string
          product_title?: string
          quantity?: number
          sku?: string | null
          unit_price_cents?: number
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dropship_order_items_dropship_order_id_fkey"
            columns: ["dropship_order_id"]
            isOneToOne: false
            referencedRelation: "dropship_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dropship_order_sync_jobs: {
        Row: {
          attempts: number
          created_at: string
          dropship_order_id: string
          id: string
          last_error: string | null
          provider_key: string
          provider_order_id: string
          run_after: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          dropship_order_id: string
          id?: string
          last_error?: string | null
          provider_key: string
          provider_order_id: string
          run_after?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          dropship_order_id?: string
          id?: string
          last_error?: string | null
          provider_key?: string
          provider_order_id?: string
          run_after?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropship_order_sync_jobs_dropship_order_id_fkey"
            columns: ["dropship_order_id"]
            isOneToOne: false
            referencedRelation: "dropship_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dropship_orders: {
        Row: {
          created_at: string
          currency: string
          customer: Json
          id: string
          last_error: string | null
          last_synced_at: string | null
          next_sync_after: string
          notes: string | null
          provider_key: string
          provider_order_id: string | null
          provider_payload: Json | null
          shipping_address: Json
          shop_surface_id: string
          status: string
          sync_attempts: number
          sync_status: string
          total_cost_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer?: Json
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          next_sync_after?: string
          notes?: string | null
          provider_key: string
          provider_order_id?: string | null
          provider_payload?: Json | null
          shipping_address?: Json
          shop_surface_id: string
          status?: string
          sync_attempts?: number
          sync_status?: string
          total_cost_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer?: Json
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          next_sync_after?: string
          notes?: string | null
          provider_key?: string
          provider_order_id?: string | null
          provider_payload?: Json | null
          shipping_address?: Json
          shop_surface_id?: string
          status?: string
          sync_attempts?: number
          sync_status?: string
          total_cost_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      dropship_provider_cooldowns: {
        Row: {
          cooldown_until: string
          provider_key: string
          updated_at: string
        }
        Insert: {
          cooldown_until: string
          provider_key: string
          updated_at?: string
        }
        Update: {
          cooldown_until?: string
          provider_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      dropship_provider_tokens: {
        Row: {
          access_token: string
          expires_at: string
          provider_key: string
          updated_at: string
        }
        Insert: {
          access_token: string
          expires_at: string
          provider_key: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          expires_at?: string
          provider_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      dropship_providers: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          name: string
          provider_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          name: string
          provider_key: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          name?: string
          provider_key?: string
        }
        Relationships: []
      }
      dropship_shipments: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          dropship_order_id: string
          id: string
          provider_shipment_id: string | null
          raw: Json | null
          shipped_at: string | null
          status: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          dropship_order_id: string
          id?: string
          provider_shipment_id?: string | null
          raw?: Json | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          dropship_order_id?: string
          id?: string
          provider_shipment_id?: string | null
          raw?: Json | null
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropship_shipments_dropship_order_id_fkey"
            columns: ["dropship_order_id"]
            isOneToOne: false
            referencedRelation: "dropship_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dropship_sync_jobs: {
        Row: {
          attempts: number
          created_at: string
          external_product_id: string
          id: string
          job_type: string
          provider_key: string
          run_after: string
          shop_surface_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          external_product_id: string
          id?: string
          job_type?: string
          provider_key: string
          run_after?: string
          shop_surface_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          external_product_id?: string
          id?: string
          job_type?: string
          provider_key?: string
          run_after?: string
          shop_surface_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_triggers: {
        Row: {
          click_count: number | null
          conditions: Json | null
          created_at: string | null
          fire_count: number | null
          id: string
          is_active: boolean | null
          last_fired_at: string | null
          last_sent_at: string | null
          open_count: number | null
          sent_count: number | null
          template_content: string | null
          template_id: string | null
          trigger_event: string
          trigger_name: string
          updated_at: string | null
        }
        Insert: {
          click_count?: number | null
          conditions?: Json | null
          created_at?: string | null
          fire_count?: number | null
          id?: string
          is_active?: boolean | null
          last_fired_at?: string | null
          last_sent_at?: string | null
          open_count?: number | null
          sent_count?: number | null
          template_content?: string | null
          template_id?: string | null
          trigger_event: string
          trigger_name?: string
          updated_at?: string | null
        }
        Update: {
          click_count?: number | null
          conditions?: Json | null
          created_at?: string | null
          fire_count?: number | null
          id?: string
          is_active?: boolean | null
          last_fired_at?: string | null
          last_sent_at?: string | null
          open_count?: number | null
          sent_count?: number | null
          template_content?: string | null
          template_id?: string | null
          trigger_event?: string
          trigger_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      entity_faqs: {
        Row: {
          answer: string
          created_at: string
          entity_id: string
          id: string
          is_visible: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          entity_id: string
          id?: string
          is_visible?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          entity_id?: string
          id?: string
          is_visible?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_faqs_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "searchable_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          entity_id: string
          id: string
          reason: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          entity_id: string
          id?: string
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          entity_id?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_reports_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "searchable_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_reviews: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string
          id: string
          is_visible: boolean
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id: string
          id?: string
          is_visible?: boolean
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string
          id?: string
          is_visible?: boolean
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_reviews_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "searchable_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_manual_overrides: {
        Row: {
          entity_id: string
          position: number
          set_by: string | null
          updated_at: string
        }
        Insert: {
          entity_id: string
          position?: number
          set_by?: string | null
          updated_at?: string
        }
        Update: {
          entity_id?: string
          position?: number
          set_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exposure_tuning_signals: {
        Row: {
          clicks_7d: number
          cooldown_factor: number
          ctr_7d: number
          ctr_boost: number
          entity_id: string
          impressions_7d: number
          overexposure_score: number
          trend_engagement_score: number
          updated_at: string
        }
        Insert: {
          clicks_7d?: number
          cooldown_factor?: number
          ctr_7d?: number
          ctr_boost?: number
          entity_id: string
          impressions_7d?: number
          overexposure_score?: number
          trend_engagement_score?: number
          updated_at?: string
        }
        Update: {
          clicks_7d?: number
          cooldown_factor?: number
          ctr_7d?: number
          ctr_boost?: number
          entity_id?: string
          impressions_7d?: number
          overexposure_score?: number
          trend_engagement_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      external_publications: {
        Row: {
          category: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_source: string
          image_url: string | null
          published_at: string | null
          source_key: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_source?: string
          image_url?: string | null
          published_at?: string | null
          source_key: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_source?: string
          image_url?: string | null
          published_at?: string | null
          source_key?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      foot_soldier_checkins: {
        Row: {
          agency_id: string
          checkin_date: string
          created_at: string | null
          id: string
          member_id: string
          users_onboarded: number | null
        }
        Insert: {
          agency_id: string
          checkin_date: string
          created_at?: string | null
          id?: string
          member_id: string
          users_onboarded?: number | null
        }
        Update: {
          agency_id?: string
          checkin_date?: string
          created_at?: string | null
          id?: string
          member_id?: string
          users_onboarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foot_soldier_checkins_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          as_of: string
          base_currency: string
          id: string
          quote_currency: string
          rate: number
        }
        Insert: {
          as_of?: string
          base_currency: string
          id?: string
          quote_currency: string
          rate: number
        }
        Update: {
          as_of?: string
          base_currency?: string
          id?: string
          quote_currency?: string
          rate?: number
        }
        Relationships: []
      }
      global_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          reply_to: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          reply_to?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          reply_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "global_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      global_chat_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "global_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_bookings: {
        Row: {
          agency_id: string
          booked_by: string
          booking_date: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: string
        }
        Insert: {
          agency_id: string
          booked_by: string
          booking_date: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string
        }
        Update: {
          agency_id?: string
          booked_by?: string
          booking_date?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_bookings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_events: {
        Row: {
          agency_id: string
          attendees: number | null
          created_at: string | null
          created_by: string | null
          end_time: string | null
          event_date: string
          hub_booking_id: string | null
          id: string
          location: string | null
          purpose: string | null
          start_time: string | null
          status: string
          title: string
        }
        Insert: {
          agency_id: string
          attendees?: number | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          event_date: string
          hub_booking_id?: string | null
          id?: string
          location?: string | null
          purpose?: string | null
          start_time?: string | null
          status?: string
          title: string
        }
        Update: {
          agency_id?: string
          attendees?: number | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          event_date?: string
          hub_booking_id?: string | null
          id?: string
          location?: string | null
          purpose?: string | null
          start_time?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_events_hub_booking_id_fkey"
            columns: ["hub_booking_id"]
            isOneToOne: false
            referencedRelation: "hub_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          source_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          source_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          source_type: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_type?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_type?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      kyc_verifications: {
        Row: {
          created_at: string
          document_urls: string[] | null
          id: string
          metadata: Json | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          source_agency_id: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_urls?: string[] | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          source_agency_id?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_urls?: string[] | null
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          source_agency_id?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_verifications_source_agency_id_fkey"
            columns: ["source_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_banners: {
        Row: {
          created_at: string
          cta_link: string | null
          cta_text: string | null
          headline: string | null
          id: string
          image_url: string | null
          is_active: boolean
          slot: string
          subheadline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          slot: string
          subheadline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          slot?: string
          subheadline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      learning_course_completions: {
        Row: {
          certificate_issued: boolean
          completed_at: string
          course_id: string
          final_score: number | null
          id: string
          user_id: string
        }
        Insert: {
          certificate_issued?: boolean
          completed_at?: string
          course_id: string
          final_score?: number | null
          id?: string
          user_id: string
        }
        Update: {
          certificate_issued?: boolean
          completed_at?: string
          course_id?: string
          final_score?: number | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_course_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_courses: {
        Row: {
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean
          is_required: boolean
          is_tot_eligible: boolean
          slug: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_tot_eligible?: boolean
          slug: string
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_tot_eligible?: boolean
          slug?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_courses_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_enrollments: {
        Row: {
          assigned_by: string | null
          assigned_reason: string | null
          course_id: string | null
          created_at: string
          due_at: string | null
          enrollment_status: string
          id: string
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_reason?: string | null
          course_id?: string | null
          created_at?: string
          due_at?: string | null
          enrollment_status?: string
          id?: string
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_reason?: string | null
          course_id?: string | null
          created_at?: string
          due_at?: string | null
          enrollment_status?: string
          id?: string
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_enrollments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_position_seconds: number | null
          last_viewed_at: string | null
          lesson_id: string
          percent_complete: number
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number | null
          last_viewed_at?: string | null
          lesson_id: string
          percent_complete?: number
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number | null
          last_viewed_at?: string | null
          lesson_id?: string
          percent_complete?: number
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_lessons: {
        Row: {
          content_body: string | null
          content_url: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          is_required: boolean
          lesson_type: string
          passing_score: number | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content_body?: string | null
          content_url?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          lesson_type: string
          passing_score?: number | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content_body?: string | null
          content_url?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          lesson_type?: string
          passing_score?: number | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_quiz_attempts: {
        Row: {
          answers: Json
          attempted_at: string
          id: string
          lesson_id: string
          passed: boolean | null
          score: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          attempted_at?: string
          id?: string
          lesson_id: string
          passed?: boolean | null
          score?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          attempted_at?: string
          id?: string
          lesson_id?: string
          passed?: boolean | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_quiz_options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          question_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          question_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "learning_quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_quiz_questions: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          question_text: string
          question_type: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          question_text: string
          question_type: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          question_text?: string
          question_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          resource_type: string
          resource_url: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          resource_type: string
          resource_url: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          resource_type?: string
          resource_url?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_role_defaults: {
        Row: {
          course_id: string | null
          id: string
          is_required: boolean
          role: string
          track_id: string | null
        }
        Insert: {
          course_id?: string | null
          id?: string
          is_required?: boolean
          role: string
          track_id?: string | null
        }
        Update: {
          course_id?: string | null
          id?: string
          is_required?: boolean
          role?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_role_defaults_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_role_defaults_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_track_completions: {
        Row: {
          completed_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_completions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_tracks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_required: boolean
          role_target: string[]
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          role_target?: string[]
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          role_target?: string[]
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_trends: {
        Row: {
          created_at: string
          duration_type: string
          ends_at: string
          id: string
          payment_amount_cents: number
          starts_at: string
          status: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_type?: string
          ends_at: string
          id?: string
          payment_amount_cents?: number
          starts_at?: string
          status?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_type?: string
          ends_at?: string
          id?: string
          payment_amount_cents?: number
          starts_at?: string
          status?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      management_assets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          asset_type: string
          created_at: string | null
          description: string | null
          file_url: string
          id: string
          rejected_reason: string | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          asset_type?: string
          created_at?: string | null
          description?: string | null
          file_url: string
          id?: string
          rejected_reason?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          asset_type?: string
          created_at?: string | null
          description?: string | null
          file_url?: string
          id?: string
          rejected_reason?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      management_team_members: {
        Row: {
          created_at: string | null
          department: string | null
          didit_session_id: string | null
          email: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          kyc_completed_at: string | null
          kyc_data: Json | null
          kyc_status: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          didit_session_id?: string | null
          email: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          kyc_completed_at?: string | null
          kyc_data?: Json | null
          kyc_status?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          didit_session_id?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          kyc_completed_at?: string | null
          kyc_data?: Json | null
          kyc_status?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      merchant_offers: {
        Row: {
          comment_count: number
          created_at: string
          description: string | null
          destination_url: string | null
          duration_type: string
          expires_at: string | null
          fee_cents: number
          header: string
          id: string
          image_url: string | null
          is_active: boolean
          love_count: number
          owner_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_count?: number
          created_at?: string
          description?: string | null
          destination_url?: string | null
          duration_type?: string
          expires_at?: string | null
          fee_cents?: number
          header: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          love_count?: number
          owner_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_count?: number
          created_at?: string
          description?: string | null
          destination_url?: string | null
          duration_type?: string
          expires_at?: string | null
          fee_cents?: number
          header?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          love_count?: number
          owner_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      merchant_promo_codes: {
        Row: {
          affiliate_id: string | null
          applicable_product_ids: string[] | null
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          duration: string
          duration_months: number | null
          eligible_users: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          one_use_per_user: boolean
          popup_config: Json | null
          promo_link: string | null
          qr_code_url: string | null
          redemption_count: number
          surface_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_id?: string | null
          applicable_product_ids?: string[] | null
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          duration?: string
          duration_months?: number | null
          eligible_users?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          one_use_per_user?: boolean
          popup_config?: Json | null
          promo_link?: string | null
          qr_code_url?: string | null
          redemption_count?: number
          surface_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_id?: string | null
          applicable_product_ids?: string[] | null
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          duration?: string
          duration_months?: number | null
          eligible_users?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          one_use_per_user?: boolean
          popup_config?: Json | null
          promo_link?: string | null
          qr_code_url?: string | null
          redemption_count?: number
          surface_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_promo_codes_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_promo_redemptions: {
        Row: {
          id: string
          promo_code_id: string
          redeemed_at: string
          user_id: string | null
          visitor_email: string | null
        }
        Insert: {
          id?: string
          promo_code_id: string
          redeemed_at?: string
          user_id?: string | null
          visitor_email?: string | null
        }
        Update: {
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string | null
          visitor_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "merchant_promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          like_count: number
          love_count: number
          offer_id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          like_count?: number
          love_count?: number
          offer_id: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          like_count?: number
          love_count?: number
          offer_id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_comments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "merchant_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "offer_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_name: string
          quantity: number
          unit_price_cents: number
          variant: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_name: string
          quantity?: number
          unit_price_cents?: number
          variant?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          unit_price_cents?: number
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_address: string | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_method: string | null
          status: string
          surface_id: string
          total_cents: number
          tracking_code: string
          updated_at: string
        }
        Insert: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          surface_id: string
          total_cents?: number
          tracking_code?: string
          updated_at?: string
        }
        Update: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          surface_id?: string
          total_cents?: number
          tracking_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "builder_surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      org_billing: {
        Row: {
          kyc_status: string
          org_id: string
          plan_tier: string
          subscription_status: string
          trial_active: boolean | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          kyc_status?: string
          org_id: string
          plan_tier?: string
          subscription_status?: string
          trial_active?: boolean | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          kyc_status?: string
          org_id?: string
          plan_tier?: string
          subscription_status?: string
          trial_active?: boolean | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_billing_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          created_at: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          name: string
          owner_user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          name: string
          owner_user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          name?: string
          owner_user_id?: string
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          meta: Json | null
          order_id: string
          provider: string
          provider_ref: string | null
          status: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          meta?: Json | null
          order_id: string
          provider: string
          provider_ref?: string | null
          status?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          meta?: Json | null
          order_id?: string
          provider?: string
          provider_ref?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          agency_id: string
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          currency: string
          disbursed_at: string | null
          id: string
          member_user_id: string
          notes: string | null
          rejection_reason: string | null
          requested_at: string
          status: string
        }
        Insert: {
          agency_id: string
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          currency?: string
          disbursed_at?: string | null
          id?: string
          member_user_id: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          agency_id?: string
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          currency?: string
          disbursed_at?: string | null
          id?: string
          member_user_id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          agency_id: string
          created_at: string
          currency: string
          id: string
          member_user_id: string
          method: string | null
          processed_at: string | null
          reference: string | null
          status: string
          total_cents: number
        }
        Insert: {
          agency_id: string
          created_at?: string
          currency?: string
          id?: string
          member_user_id: string
          method?: string | null
          processed_at?: string | null
          reference?: string | null
          status?: string
          total_cents?: number
        }
        Update: {
          agency_id?: string
          created_at?: string
          currency?: string
          id?: string
          member_user_id?: string
          method?: string | null
          processed_at?: string | null
          reference?: string | null
          status?: string
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_alerts: {
        Row: {
          alert_type: string
          created_at: string
          detail: string | null
          id: string
          is_resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_entity_id: string | null
          source_table: string | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          detail?: string | null
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_entity_id?: string | null
          source_table?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          detail?: string | null
          id?: string
          is_resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_entity_id?: string | null
          source_table?: string | null
          title?: string
        }
        Relationships: []
      }
      platform_incidents: {
        Row: {
          affected_system: string | null
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          reported_by: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_system?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_system?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          agency_id: string | null
          avatar_emoji_key: string | null
          avatar_mode: string
          avatar_url: string | null
          business_name: string | null
          country: string | null
          cover_crop: Json | null
          cover_url: string | null
          created_at: string
          creator_type: Database["public"]["Enums"]["creator_type"] | null
          dashboard_credit_claimed: boolean
          display_name: string | null
          email_verified_at: string | null
          free_images_used: number
          free_videos_used: number
          id: string
          last_onboarding_reminder_sent_at: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          onboarding_started_at: string | null
          onboarding_step: string | null
          referred_by: string | null
          social_links: Json | null
          updated_at: string
          username: string | null
          verified_tick: string | null
          welcome_email_sent_at: string | null
        }
        Insert: {
          account_status?: string
          agency_id?: string | null
          avatar_emoji_key?: string | null
          avatar_mode?: string
          avatar_url?: string | null
          business_name?: string | null
          country?: string | null
          cover_crop?: Json | null
          cover_url?: string | null
          created_at?: string
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
          dashboard_credit_claimed?: boolean
          display_name?: string | null
          email_verified_at?: string | null
          free_images_used?: number
          free_videos_used?: number
          id: string
          last_onboarding_reminder_sent_at?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          onboarding_step?: string | null
          referred_by?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
          verified_tick?: string | null
          welcome_email_sent_at?: string | null
        }
        Update: {
          account_status?: string
          agency_id?: string | null
          avatar_emoji_key?: string | null
          avatar_mode?: string
          avatar_url?: string | null
          business_name?: string | null
          country?: string | null
          cover_crop?: Json | null
          cover_url?: string | null
          created_at?: string
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
          dashboard_credit_claimed?: boolean
          display_name?: string | null
          email_verified_at?: string | null
          free_images_used?: number
          free_videos_used?: number
          id?: string
          last_onboarding_reminder_sent_at?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          onboarding_step?: string | null
          referred_by?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
          verified_tick?: string | null
          welcome_email_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_campaigns: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          key: string
          message: string
          reward_payload: Json
          reward_type: string
          starts_at: string | null
          title: string
          trigger_payload: Json | null
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          message: string
          reward_payload: Json
          reward_type: string
          starts_at?: string | null
          title: string
          trigger_payload?: Json | null
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          message?: string
          reward_payload?: Json
          reward_type?: string
          starts_at?: string | null
          title?: string
          trigger_payload?: Json | null
          trigger_type?: string
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          campaign_id: string
          granted_at: string | null
          id: string
          meta: Json | null
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          granted_at?: string | null
          id?: string
          meta?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          granted_at?: string | null
          id?: string
          meta?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          provider_key: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          provider_key: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          provider_key?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_registry: {
        Row: {
          config_schema: Json | null
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          provider_key: string
          provider_type: string
          updated_at: string
        }
        Insert: {
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          provider_key: string
          provider_type: string
          updated_at?: string
        }
        Update: {
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          provider_key?: string
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_surfaces: {
        Row: {
          created_at: string
          custom_domain: string | null
          description: string | null
          domain_id: string
          id: string
          is_featured: boolean
          is_published: boolean
          metadata: Json | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          domain_id: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          metadata?: Json | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          domain_id?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          metadata?: Json | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_surfaces_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "surface_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_attempt_logs: {
        Row: {
          created_at: string
          domain_id: string
          id: string
          org_id: string
          reason: string
          surface_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          id?: string
          org_id: string
          reason: string
          surface_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          id?: string
          org_id?: string
          reason?: string
          surface_id?: string
          user_id?: string
        }
        Relationships: []
      }
      quota_addons: {
        Row: {
          asset_type: string
          created_at: string | null
          expires_at: string
          extra: number
          id: string
          user_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          expires_at: string
          extra?: number
          id?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          expires_at?: string
          extra?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          action_key: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_key: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_key?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          agency_id: string | null
          converted_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          referred_by_user_id: string
          referred_user_id: string
          source: string
          status: string
        }
        Insert: {
          agency_id?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          referred_by_user_id: string
          referred_user_id: string
          source?: string
          status?: string
        }
        Update: {
          agency_id?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          referred_by_user_id?: string
          referred_user_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      searchable_entities: {
        Row: {
          avg_rating: number | null
          builder_surface_id: string | null
          builder_surface_type: string | null
          cover_image_url: string | null
          created_at: string
          domain_host: string | null
          entity_subtype: Database["public"]["Enums"]["entity_subtype"]
          entity_type: Database["public"]["Enums"]["searchable_entity_type"]
          id: string
          industry: string | null
          is_ad_eligible: boolean
          is_published: boolean
          is_searchable: boolean
          is_verified: boolean
          owner_org_id: string | null
          owner_user_id: string
          primary_category: string | null
          promotion_id: string | null
          published_at: string | null
          report_count: number
          review_count: number
          short_description: string | null
          slug: string | null
          surface_id: string | null
          surface_type: string | null
          tags: string[]
          title: string
          trust_score: number
          updated_at: string
          visibility_tier: Database["public"]["Enums"]["visibility_tier"]
        }
        Insert: {
          avg_rating?: number | null
          builder_surface_id?: string | null
          builder_surface_type?: string | null
          cover_image_url?: string | null
          created_at?: string
          domain_host?: string | null
          entity_subtype?: Database["public"]["Enums"]["entity_subtype"]
          entity_type: Database["public"]["Enums"]["searchable_entity_type"]
          id?: string
          industry?: string | null
          is_ad_eligible?: boolean
          is_published?: boolean
          is_searchable?: boolean
          is_verified?: boolean
          owner_org_id?: string | null
          owner_user_id: string
          primary_category?: string | null
          promotion_id?: string | null
          published_at?: string | null
          report_count?: number
          review_count?: number
          short_description?: string | null
          slug?: string | null
          surface_id?: string | null
          surface_type?: string | null
          tags?: string[]
          title: string
          trust_score?: number
          updated_at?: string
          visibility_tier?: Database["public"]["Enums"]["visibility_tier"]
        }
        Update: {
          avg_rating?: number | null
          builder_surface_id?: string | null
          builder_surface_type?: string | null
          cover_image_url?: string | null
          created_at?: string
          domain_host?: string | null
          entity_subtype?: Database["public"]["Enums"]["entity_subtype"]
          entity_type?: Database["public"]["Enums"]["searchable_entity_type"]
          id?: string
          industry?: string | null
          is_ad_eligible?: boolean
          is_published?: boolean
          is_searchable?: boolean
          is_verified?: boolean
          owner_org_id?: string | null
          owner_user_id?: string
          primary_category?: string | null
          promotion_id?: string | null
          published_at?: string | null
          report_count?: number
          review_count?: number
          short_description?: string | null
          slug?: string | null
          surface_id?: string | null
          surface_type?: string | null
          tags?: string[]
          title?: string
          trust_score?: number
          updated_at?: string
          visibility_tier?: Database["public"]["Enums"]["visibility_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "searchable_entities_builder_surface_id_fkey"
            columns: ["builder_surface_id"]
            isOneToOne: true
            referencedRelation: "builder_surfaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "searchable_entities_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "searchable_entities_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "community_promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "searchable_entities_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: true
            referencedRelation: "surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_alerts: {
        Row: {
          alert_type: string
          created_at: string
          current_value: number | null
          id: string
          is_resolved: boolean
          message: string
          metric: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          threshold_value: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_resolved?: boolean
          message: string
          metric: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          threshold_value?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_resolved?: boolean
          message?: string
          metric?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          threshold_value?: number | null
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token_encrypted: string | null
          account_id: string | null
          account_name: string | null
          connected_at: string | null
          connected_by: string | null
          created_at: string
          followers_count: number | null
          id: string
          metadata: Json | null
          platform: string
          refresh_token_encrypted: string | null
          status: string
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          metadata?: Json | null
          platform: string
          refresh_token_encrypted?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          metadata?: Json | null
          platform?: string
          refresh_token_encrypted?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          engagement: Json | null
          id: string
          media_urls: string[] | null
          platform: string
          published_at: string | null
          scheduled_for: string | null
          status: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          engagement?: Json | null
          id?: string
          media_urls?: string[] | null
          platform: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          engagement?: Json | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      studio_assets: {
        Row: {
          asset_type: string
          created_at: string
          download_credits: number
          file_url: string | null
          generation_prompt: string | null
          id: string
          is_uploaded: boolean
          language: string | null
          metadata: Json | null
          platform: string | null
          project_id: string
          thumbnail_url: string | null
          title: string | null
          user_id: string
          variation_index: number | null
        }
        Insert: {
          asset_type: string
          created_at?: string
          download_credits?: number
          file_url?: string | null
          generation_prompt?: string | null
          id?: string
          is_uploaded?: boolean
          language?: string | null
          metadata?: Json | null
          platform?: string | null
          project_id: string
          thumbnail_url?: string | null
          title?: string | null
          user_id: string
          variation_index?: number | null
        }
        Update: {
          asset_type?: string
          created_at?: string
          download_credits?: number
          file_url?: string | null
          generation_prompt?: string | null
          id?: string
          is_uploaded?: boolean
          language?: string | null
          metadata?: Json | null
          platform?: string | null
          project_id?: string
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string
          variation_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          album_published: boolean
          album_slug: string | null
          brand_blueprint: Json | null
          brand_description: string | null
          brand_name: string | null
          content_types: string[] | null
          created_at: string
          id: string
          metadata: Json | null
          product_url: string | null
          status: string
          target_language: string | null
          target_platforms: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          album_published?: boolean
          album_slug?: string | null
          brand_blueprint?: Json | null
          brand_description?: string | null
          brand_name?: string | null
          content_types?: string[] | null
          created_at?: string
          id?: string
          metadata?: Json | null
          product_url?: string | null
          status?: string
          target_language?: string | null
          target_platforms?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          album_published?: boolean
          album_slug?: string | null
          brand_blueprint?: Json | null
          brand_description?: string | null
          brand_name?: string | null
          content_types?: string[] | null
          created_at?: string
          id?: string
          metadata?: Json | null
          product_url?: string | null
          status?: string
          target_language?: string | null
          target_platforms?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      surface_domains: {
        Row: {
          created_at: string
          description: string | null
          domain: string
          id: string
          is_active: boolean
          label: string
          surface_type: Database["public"]["Enums"]["surface_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain: string
          id?: string
          is_active?: boolean
          label: string
          surface_type: Database["public"]["Enums"]["surface_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string
          id?: string
          is_active?: boolean
          label?: string
          surface_type?: Database["public"]["Enums"]["surface_type"]
        }
        Relationships: []
      }
      surface_publishes: {
        Row: {
          blocked_reasons: Json | null
          domain_id: string
          id: string
          is_primary: boolean
          org_id: string
          published_at: string | null
          slug: string | null
          state: string
          surface_id: string
          unpublished_at: string | null
        }
        Insert: {
          blocked_reasons?: Json | null
          domain_id: string
          id?: string
          is_primary?: boolean
          org_id: string
          published_at?: string | null
          slug?: string | null
          state: string
          surface_id: string
          unpublished_at?: string | null
        }
        Update: {
          blocked_reasons?: Json | null
          domain_id?: string
          id?: string
          is_primary?: boolean
          org_id?: string
          published_at?: string | null
          slug?: string | null
          state?: string
          surface_id?: string
          unpublished_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surface_publishes_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surface_publishes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surface_publishes_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      surface_settings: {
        Row: {
          accent_color: string | null
          created_at: string
          custom_css: string | null
          favicon_url: string | null
          id: string
          login_mode: Database["public"]["Enums"]["login_mode"]
          logo_url: string | null
          primary_color: string | null
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          social_links: Json | null
          surface_id: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          id?: string
          login_mode?: Database["public"]["Enums"]["login_mode"]
          logo_url?: string | null
          primary_color?: string | null
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          social_links?: Json | null
          surface_id: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          id?: string
          login_mode?: Database["public"]["Enums"]["login_mode"]
          logo_url?: string | null
          primary_color?: string | null
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          social_links?: Json | null
          surface_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surface_settings_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: true
            referencedRelation: "public_surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      surfaces: {
        Row: {
          archived_at: string | null
          created_at: string | null
          draft_domain_id: string | null
          draft_slug: string | null
          id: string
          org_id: string
          status: string
          surface_type: string
          title: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          draft_domain_id?: string | null
          draft_slug?: string | null
          id?: string
          org_id: string
          status?: string
          surface_type: string
          title?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          draft_domain_id?: string | null
          draft_slug?: string | null
          id?: string
          org_id?: string
          status?: string
          surface_type?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surfaces_draft_domain_id_fkey"
            columns: ["draft_domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surfaces_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      trials: {
        Row: {
          converted_at: string | null
          created_at: string
          expires_at: string
          id: string
          started_at: string
          surface_id: string | null
          user_id: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          started_at?: string
          surface_id?: string | null
          user_id: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          surface_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trials_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "public_surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_quota_config: {
        Row: {
          creator_limit: number | null
          free_limit: number
          is_enabled: boolean
          key: string
          reset_days: number
          starter_limit: number
          updated_at: string
        }
        Insert: {
          creator_limit?: number | null
          free_limit?: number
          is_enabled?: boolean
          key: string
          reset_days?: number
          starter_limit?: number
          updated_at?: string
        }
        Update: {
          creator_limit?: number | null
          free_limit?: number
          is_enabled?: boolean
          key?: string
          reset_days?: number
          starter_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_entitlements: {
        Row: {
          ai_avatars_monthly_limit: number
          ai_avatars_used: number
          ai_images_monthly_limit: number
          ai_images_used: number
          ai_videos_monthly_limit: number
          ai_videos_used: number
          billing_period_end: string | null
          billing_period_start: string | null
          plan_id: string
          published_surfaces_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_avatars_monthly_limit?: number
          ai_avatars_used?: number
          ai_images_monthly_limit?: number
          ai_images_used?: number
          ai_videos_monthly_limit?: number
          ai_videos_used?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          plan_id?: string
          published_surfaces_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_avatars_monthly_limit?: number
          ai_avatars_used?: number
          ai_images_monthly_limit?: number
          ai_images_used?: number
          ai_videos_monthly_limit?: number
          ai_videos_used?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          plan_id?: string
          published_surfaces_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_type: string | null
          media_urls: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_urls?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_urls?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_usage_quotas: {
        Row: {
          locked_until: string | null
          period_started_at: string
          quota_key: string
          used_count: number
          user_id: string
        }
        Insert: {
          locked_until?: string | null
          period_started_at?: string
          quota_key: string
          used_count?: number
          user_id: string
        }
        Update: {
          locked_until?: string | null
          period_started_at?: string
          quota_key?: string
          used_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_usage_quotas_quota_key_fkey"
            columns: ["quota_key"]
            isOneToOne: false
            referencedRelation: "usage_quota_config"
            referencedColumns: ["key"]
          },
        ]
      }
      verification_requests: {
        Row: {
          created_at: string
          id: string
          status: string
          tick_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          tick_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          tick_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vision_board_goals: {
        Row: {
          actual_kyc_users: number | null
          actual_subscribers: number | null
          agency_id: string
          created_at: string | null
          created_by: string | null
          goal_type: string
          id: string
          period_end: string
          period_start: string
          status: string
          target_kyc_users: number | null
          target_subscribers: number | null
        }
        Insert: {
          actual_kyc_users?: number | null
          actual_subscribers?: number | null
          agency_id: string
          created_at?: string | null
          created_by?: string | null
          goal_type?: string
          id?: string
          period_end: string
          period_start: string
          status?: string
          target_kyc_users?: number | null
          target_subscribers?: number | null
        }
        Update: {
          actual_kyc_users?: number | null
          actual_subscribers?: number | null
          agency_id?: string
          created_at?: string | null
          created_by?: string | null
          goal_type?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          target_kyc_users?: number | null
          target_subscribers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vision_board_goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_board_tasks: {
        Row: {
          agency_id: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          agency_id: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          agency_id?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vision_board_tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      visionaire_items: {
        Row: {
          category: string
          content: Json
          created_at: string
          description: string | null
          download_url: string | null
          external_url: string | null
          file_size: string | null
          format: string | null
          id: string
          is_active: boolean
          page_count: number | null
          preview_image_url: string | null
          slug: string | null
          sort_order: number | null
          source_url: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          type: string
          word_count: number | null
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string
          description?: string | null
          download_url?: string | null
          external_url?: string | null
          file_size?: string | null
          format?: string | null
          id?: string
          is_active?: boolean
          page_count?: number | null
          preview_image_url?: string | null
          slug?: string | null
          sort_order?: number | null
          source_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          type: string
          word_count?: number | null
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          description?: string | null
          download_url?: string | null
          external_url?: string | null
          file_size?: string | null
          format?: string | null
          id?: string
          is_active?: boolean
          page_count?: number | null
          preview_image_url?: string | null
          slug?: string | null
          sort_order?: number | null
          source_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          word_count?: number | null
        }
        Relationships: []
      }
      visionaire_product_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          sort_order: number | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
          votes_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
          votes_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          votes_count?: number
        }
        Relationships: []
      }
      visionaire_request_votes: {
        Row: {
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visionaire_request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "visionaire_product_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      visionaire_tool_runs: {
        Row: {
          created_at: string
          id: string
          input: Json
          output: string | null
          tool_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input?: Json
          output?: string | null
          tool_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input?: Json
          output?: string | null
          tool_key?: string
          user_id?: string
        }
        Relationships: []
      }
      visionaire_user_saves: {
        Row: {
          created_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visionaire_user_saves_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "visionaire_items"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          event_id: string | null
          id: string
          payload: Json
          provider: string
          received_at: string
        }
        Insert: {
          event_id?: string | null
          id?: string
          payload: Json
          provider: string
          received_at?: string
        }
        Update: {
          event_id?: string | null
          id?: string
          payload?: Json
          provider?: string
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      connected_accounts_safe: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          provider: string | null
          provider_user_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          provider?: string | null
          provider_user_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          provider?: string | null
          provider_user_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_ads_view: {
        Row: {
          content: string | null
          created_at: string | null
          ends_at: string | null
          id: string | null
          image_url: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["ad_status"] | null
          target_url: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string | null
          image_url?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ad_status"] | null
          target_url?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string | null
          image_url?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ad_status"] | null
          target_url?: string | null
          title?: string | null
        }
        Relationships: []
      }
      public_profile_view: {
        Row: {
          avatar_emoji_key: string | null
          avatar_mode: string | null
          avatar_url: string | null
          business_name: string | null
          country: string | null
          cover_crop: Json | null
          cover_url: string | null
          created_at: string | null
          creator_type: Database["public"]["Enums"]["creator_type"] | null
          display_name: string | null
          id: string | null
          social_links: Json | null
          username: string | null
          verified_tick: string | null
        }
        Insert: {
          avatar_emoji_key?: string | null
          avatar_mode?: string | null
          avatar_url?: string | null
          business_name?: string | null
          country?: string | null
          cover_crop?: Json | null
          cover_url?: string | null
          created_at?: string | null
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
          display_name?: string | null
          id?: string | null
          social_links?: Json | null
          username?: string | null
          verified_tick?: string | null
        }
        Update: {
          avatar_emoji_key?: string | null
          avatar_mode?: string | null
          avatar_url?: string | null
          business_name?: string | null
          country?: string | null
          cover_crop?: Json | null
          cover_url?: string | null
          created_at?: string | null
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
          display_name?: string | null
          id?: string | null
          social_links?: Json | null
          username?: string | null
          verified_tick?: string | null
        }
        Relationships: []
      }
      public_vote_counts: {
        Row: {
          request_id: string | null
          vote_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visionaire_request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "visionaire_product_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _evaluate_publish_eligibility_internal: {
        Args: {
          p_domain_id: string
          p_org_id: string
          p_surface_id: string
          p_user_id: string
        }
        Returns: {
          eligible: boolean
          reasons: string[]
        }[]
      }
      accept_pending_invite: { Args: never; Returns: undefined }
      accept_team_invite: { Args: { p_invite_id: string }; Returns: undefined }
      add_credits: {
        Args: {
          _amount: number
          _description?: string
          _transaction_type?: string
          _user_id: string
        }
        Returns: Json
      }
      admin_get_publish_attempt_logs: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          domain_id: string
          id: string
          org_id: string
          reason: string
          surface_id: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "publish_attempt_logs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_grant_credits_by_email: {
        Args: { p_amount: number; p_email: string; p_note?: string }
        Returns: undefined
      }
      admin_reset_user_onboarding: {
        Args: { p_email: string }
        Returns: undefined
      }
      admin_reset_user_quota: {
        Args: { p_quota_key: string; p_user_id: string }
        Returns: undefined
      }
      admin_review_app: {
        Args: { p_decision: string; p_listing_id: string; p_notes?: string }
        Returns: undefined
      }
      admin_set_user_entitlements: {
        Args: { p_plan_id: string; p_user_id: string }
        Returns: undefined
      }
      admin_update_quota_config: {
        Args: {
          p_creator_limit: number
          p_free_limit: number
          p_is_enabled: boolean
          p_key: string
          p_reset_days: number
          p_starter_limit: number
        }
        Returns: undefined
      }
      app_has_scope: {
        Args: { p_app_id: string; p_scope_key: string }
        Returns: boolean
      }
      archive_surface: { Args: { p_surface_id: string }; Returns: Json }
      builder_create_page: {
        Args: { p_slug: string; p_surface_id: string; p_title: string }
        Returns: Json
      }
      builder_delete_page: { Args: { p_page_id: string }; Returns: Json }
      builder_delete_section: { Args: { p_section_id: string }; Returns: Json }
      builder_duplicate_page: {
        Args: { p_new_slug?: string; p_new_title?: string; p_page_id: string }
        Returns: Json
      }
      builder_get_editor_state: {
        Args: { p_surface_id: string }
        Returns: Json
      }
      builder_get_public_schema: {
        Args: { p_host: string; p_slug?: string }
        Returns: Json
      }
      builder_is_domain_allowed: {
        Args: { p_host: string; p_surface_type: string }
        Returns: boolean
      }
      builder_publish_surface: {
        Args: { p_domain_id: string; p_slug?: string; p_surface_id: string }
        Returns: Json
      }
      builder_rename_page: {
        Args: { p_page_id: string; p_slug: string; p_title: string }
        Returns: Json
      }
      builder_reorder_pages: {
        Args: { p_ordered_ids: string[]; p_surface_id: string }
        Returns: Json
      }
      builder_reorder_sections: {
        Args: { p_ordered_ids: string[]; p_page_id: string }
        Returns: Json
      }
      builder_switch_main_content: {
        Args: {
          p_default_schema?: Json
          p_new_section_type: string
          p_page_id: string
        }
        Returns: Json
      }
      builder_unpublish_surface: {
        Args: { p_publish_id: string }
        Returns: Json
      }
      builder_update_surface: {
        Args: {
          p_description: string
          p_metadata: Json
          p_slug: string
          p_surface_id: string
          p_title: string
        }
        Returns: Json
      }
      builder_upsert_section: {
        Args: {
          p_core_slot?: string
          p_is_visible?: boolean
          p_page_id: string
          p_position?: number
          p_schema?: Json
          p_section_id?: string
          p_section_type?: string
        }
        Returns: Json
      }
      calculate_ai_visibility_score: {
        Args: { p_days?: number }
        Returns: Json
      }
      can_list_on_community: {
        Args: { p_surface_id: string }
        Returns: boolean
      }
      can_publish_more_surfaces: { Args: never; Returns: Json }
      can_publish_surface: {
        Args: { _surface_id: string; _user_id: string }
        Returns: boolean
      }
      cancel_hub_booking: { Args: { p_booking_id: string }; Returns: undefined }
      charge_reserved: {
        Args: { p_amount: number; p_ref_id: string; p_ref_type: string }
        Returns: undefined
      }
      check_and_increment_app_rate_limit: {
        Args: { p_app_id: string; p_bucket_key?: string }
        Returns: Json
      }
      check_and_increment_quota: {
        Args: { p_quota_key: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_action_key: string
          p_max_count: number
          p_user_id: string
          p_window_seconds: number
        }
        Returns: boolean
      }
      check_rate_limit_anon: {
        Args: {
          p_action_key: string
          p_identifier: string
          p_max_count: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      claim_dashboard_credits: { Args: never; Returns: Json }
      cleanup_rate_limit_log: { Args: never; Returns: undefined }
      complete_dropship_order_sync_job: {
        Args: {
          p_error?: string
          p_job_id: string
          p_new_status?: string
          p_provider_payload?: Json
          p_success: boolean
          p_tracking?: Json
        }
        Returns: undefined
      }
      complete_dropship_sync_job: {
        Args: {
          p_error?: string
          p_job_id: string
          p_new_snapshot?: Json
          p_success: boolean
        }
        Returns: undefined
      }
      complete_onboarding:
        | {
            Args: {
              _display_name?: string
              _user_id: string
              _username: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _creator_type?: Database["public"]["Enums"]["creator_type"]
              _display_name?: string
              _surface_slug?: string
              _user_id: string
              _username: string
            }
            Returns: string
          }
      compute_trust_score: {
        Args: {
          p_avg_rating: number
          p_has_cover: boolean
          p_has_description: boolean
          p_has_tags: boolean
          p_is_verified: boolean
          p_published_at: string
          p_report_count: number
          p_review_count: number
        }
        Returns: number
      }
      consume_ai_avatar_credit: { Args: never; Returns: Json }
      consume_ai_image_credit: { Args: never; Returns: Json }
      consume_ai_video_credit: { Args: never; Returns: Json }
      consume_entitlement: {
        Args: { p_amount?: number; p_asset_type: string }
        Returns: undefined
      }
      consume_free_image: { Args: never; Returns: Json }
      consume_free_video: { Args: never; Returns: Json }
      count_org_active_publishes: {
        Args: { p_org_id: string }
        Returns: number
      }
      count_published_surfaces: { Args: { _user_id: string }; Returns: number }
      create_app_key: {
        Args: { p_app_id: string; p_environment?: string }
        Returns: Json
      }
      create_creatify_generation: {
        Args: { p_cost_credits?: number; p_params?: Json; p_prompt: string }
        Returns: string
      }
      create_developer_app: {
        Args: { p_name: string; p_org_id: string; p_slug: string }
        Returns: string
      }
      create_dropship_order_intent: {
        Args: {
          p_customer: Json
          p_items: Json
          p_notes?: string
          p_provider_key: string
          p_shipping_address: Json
          p_shop_surface_id: string
        }
        Returns: string
      }
      create_hub_booking: {
        Args: {
          p_agency_id: string
          p_date: string
          p_end: string
          p_notes?: string
          p_start: string
        }
        Returns: string
      }
      create_ideogram_generation:
        | { Args: { p_params?: Json; p_prompt: string }; Returns: string }
        | {
            Args: { p_cost_credits?: number; p_params?: Json; p_prompt: string }
            Returns: string
          }
      create_qwen_generation:
        | { Args: { p_params?: Json; p_prompt: string }; Returns: string }
        | {
            Args: { p_cost_credits?: number; p_params?: Json; p_prompt: string }
            Returns: string
          }
      create_widget_install_token: {
        Args: { p_surface_install_id: string }
        Returns: string
      }
      deduct_download_credit: { Args: { p_asset_id: string }; Returns: Json }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_surface: { Args: { p_surface_id: string }; Returns: Json }
      derive_entity_subtype: {
        Args: { p_industry?: string; p_surface_type: string }
        Returns: Database["public"]["Enums"]["entity_subtype"]
      }
      derive_entity_type: {
        Args: { p_surface_type: string }
        Returns: Database["public"]["Enums"]["searchable_entity_type"]
      }
      developer_check_and_increment_usage:
        | {
            Args: { p_app_id: string; p_endpoint: string; p_method?: string }
            Returns: Json
          }
        | {
            Args: {
              p_app_id: string
              p_endpoint: string
              p_latency_ms?: number
              p_success: boolean
            }
            Returns: Json
          }
      developer_get_usage_summary:
        | { Args: { p_app_id: string }; Returns: Json }
        | { Args: { p_app_id?: string; p_days?: number }; Returns: Json }
      discovery_analytics_summary: { Args: { p_days?: number }; Returns: Json }
      dismiss_promo: { Args: { p_campaign_key: string }; Returns: undefined }
      enqueue_dropship_order_sync_jobs: {
        Args: { p_limit?: number }
        Returns: number
      }
      enqueue_dropship_sync_jobs: {
        Args: { p_limit?: number }
        Returns: number
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_webhook_event: {
        Args: { p_app_id: string; p_event_type: string; p_payload?: Json }
        Returns: string
      }
      ensure_my_entitlements: { Args: never; Returns: Json }
      escalate_agency_ticket: {
        Args: { p_reason?: string; p_ticket_id: string }
        Returns: undefined
      }
      evaluate_publish_eligibility: {
        Args: {
          p_domain_id: string
          p_org_id: string
          p_slug: string
          p_surface_id: string
        }
        Returns: {
          eligible: boolean
          reasons: string[]
        }[]
      }
      get_agency_dashboard: { Args: { p_agency_id: string }; Returns: Json }
      get_agency_dashboard_v2: { Args: { p_agency_id: string }; Returns: Json }
      get_agency_members: { Args: { p_agency_id: string }; Returns: Json }
      get_agency_payouts: {
        Args: { p_agency_id: string; p_user_id?: string }
        Returns: Json
      }
      get_agency_referrals: {
        Args: { p_agency_id: string; p_user_id?: string }
        Returns: Json
      }
      get_agency_support_tickets: {
        Args: { p_agency_id: string }
        Returns: Json
      }
      get_anthropic_publications: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          category: string
          excerpt: string
          id: string
          image_source: string
          image_url: string
          published_at: string
          title: string
          url: string
        }[]
      }
      get_app_runtime_context: { Args: { p_app_id: string }; Returns: Json }
      get_builder_community_listings: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_commissions: {
        Args: { p_agency_id: string; p_user_id?: string }
        Returns: Json
      }
      get_community_section: {
        Args: {
          p_category_key?: string
          p_limit?: number
          p_offset?: number
          p_section: string
        }
        Returns: {
          category: string
          cover_image: string
          description: string
          domain_host: string
          listed_at: string
          org_id: string
          price_text: string
          slug: string
          surface_id: string
          title: string
        }[]
      }
      get_creator_payment_methods: {
        Args: { p_creator_id: string }
        Returns: Json
      }
      get_default_domain_for_creator: {
        Args: { _creator_type: Database["public"]["Enums"]["creator_type"] }
        Returns: string
      }
      get_dropship_provider_token: {
        Args: { p_provider_key: string }
        Returns: {
          access_token: string
          expires_at: string
        }[]
      }
      get_entity_by_slug: {
        Args: { p_slug: string }
        Returns: {
          avg_rating: number
          cover_image_url: string
          domain_host: string
          entity_subtype: string
          entity_type: string
          id: string
          industry: string
          is_verified: boolean
          owner_user_id: string
          primary_category: string
          published_at: string
          review_count: number
          short_description: string
          slug: string
          surface_type: string
          tags: string[]
          title: string
          trust_score: number
          visibility_tier: string
        }[]
      }
      get_hub_bookings: { Args: { p_agency_id: string }; Returns: Json }
      get_kyc_status: { Args: { p_user_id: string }; Returns: Json }
      get_my_active_promos: {
        Args: never
        Returns: {
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          key: string
          message: string
          reward_payload: Json
          reward_type: string
          starts_at: string | null
          title: string
          trigger_payload: Json | null
          trigger_type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "promo_campaigns"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_agency_stats: { Args: { p_agency_id: string }; Returns: Json }
      get_my_credit_balance: { Args: never; Returns: number }
      get_my_entitlements: { Args: never; Returns: Json }
      get_my_image_generations: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          error: string | null
          id: string
          params: Json
          prompt: string
          provider: string
          result_images: Json | null
          status: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ai_image_generations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_video_generations: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          error: string | null
          id: string
          params: Json
          prompt: string
          provider: string
          result_videos: Json | null
          status: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ai_video_generations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_own_kyc_documents: {
        Args: never
        Returns: {
          created_at: string
          document_count: number
          id: string
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string
        }[]
      }
      get_public_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_emoji_key: string
          avatar_mode: string
          avatar_url: string
          business_name: string
          country: string
          cover_crop: Json
          cover_url: string
          creator_type: string
          display_name: string
          id: string
          social_links: Json
          username: string
          verified_tick: string
        }[]
      }
      get_published_surface: {
        Args: { p_publish_id?: string; p_surface_id?: string }
        Returns: Json
      }
      get_referrals: {
        Args: { p_agency_id: string; p_user_id?: string }
        Returns: Json
      }
      get_related_entities: {
        Args: { p_entity_id: string; p_limit?: number }
        Returns: {
          cover_image_url: string
          domain_host: string
          entity_subtype: string
          entity_type: string
          id: string
          industry: string
          is_verified: boolean
          primary_category: string
          published_at: string
          relatedness_score: number
          short_description: string
          slug: string
          surface_type: string
          tags: string[]
          title: string
          trust_score: number
          visibility_tier: string
        }[]
      }
      grant_credits: {
        Args: { p_amount: number; p_note?: string; p_user_id: string }
        Returns: undefined
      }
      grant_promo: {
        Args: { p_campaign_key: string; p_user_id: string }
        Returns: undefined
      }
      has_approved_kyc: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_used_trial: { Args: { _user_id: string }; Returns: boolean }
      import_external_product_to_shop:
        | {
            Args: {
              p_display_currency?: string
              p_display_price_cents?: number
              p_external_product_id: string
              p_fx_rate?: number
              p_fx_rate_timestamp?: string
              p_images?: string
              p_provider_currency?: string
              p_provider_key: string
              p_provider_price_cents?: number
              p_raw?: string
              p_shop_surface_id: string
              p_title: string
              p_variants?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_external_product_id: string
              p_images?: Json
              p_provider_key: string
              p_raw?: Json
              p_shop_surface_id: string
              p_title: string
              p_variants?: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_display_currency?: string
              p_display_price_cents?: number
              p_external_product_id: string
              p_fx_rate?: number
              p_fx_rate_timestamp?: string
              p_images: Json
              p_provider_currency?: string
              p_provider_key: string
              p_provider_price_cents?: number
              p_raw: Json
              p_shop_surface_id: string
              p_title: string
              p_variants: Json
            }
            Returns: Json
          }
      is_drive_connected: { Args: never; Returns: boolean }
      is_dropship_provider_cooled_down: {
        Args: { p_provider_key: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_creator: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_slug_available: {
        Args: { _domain_id: string; _slug: string }
        Returns: boolean
      }
      is_username_available: { Args: { _username: string }; Returns: boolean }
      list_on_community: { Args: { p_surface_id: string }; Returns: Json }
      manage_agencies_overview: { Args: never; Returns: Json }
      manage_ai_usage_stats: {
        Args: { p_days?: number; p_limit?: number }
        Returns: Json
      }
      manage_alerts_list: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_severity?: string
          p_status?: string
        }
        Returns: Json
      }
      manage_analytics_investor: { Args: { p_days?: number }; Returns: Json }
      manage_analytics_overview: { Args: { p_days?: number }; Returns: Json }
      manage_audit_log_filters: { Args: never; Returns: Json }
      manage_audit_logs_list: {
        Args: {
          p_action?: string
          p_entity_type?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: Json
      }
      manage_automation_executions: {
        Args: { p_limit?: number; p_rule_id: string }
        Returns: Json
      }
      manage_automation_rules_list: { Args: never; Returns: Json }
      manage_command_center: { Args: never; Returns: Json }
      manage_command_center_v2: { Args: never; Returns: Json }
      manage_community_promotions: { Args: never; Returns: Json }
      manage_create_automation_rule: {
        Args: {
          p_action_config: Json
          p_action_type: string
          p_description: string
          p_name: string
          p_trigger_config: Json
          p_trigger_type: string
        }
        Returns: string
      }
      manage_data_integrity_check: { Args: never; Returns: Json }
      manage_delete_automation_rule: {
        Args: { p_rule_id: string }
        Returns: undefined
      }
      manage_delete_page: { Args: { p_page_id: string }; Returns: undefined }
      manage_delete_post: { Args: { p_post_id: string }; Returns: undefined }
      manage_delete_promo: { Args: { p_promo_id: string }; Returns: undefined }
      manage_domains_list: { Args: never; Returns: Json }
      manage_events_overview: { Args: never; Returns: Json }
      manage_explore_surfaces: { Args: never; Returns: Json }
      manage_explore_surfaces_stats: { Args: never; Returns: Json }
      manage_explore_users_stats: { Args: never; Returns: Json }
      manage_get_user_detail: { Args: { p_user_id: string }; Returns: Json }
      manage_global_search: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      manage_incident_upsert: {
        Args: {
          p_affected_system?: string
          p_description?: string
          p_id?: string
          p_severity?: string
          p_status?: string
          p_title?: string
        }
        Returns: string
      }
      manage_incidents_list: {
        Args: { p_severity?: string; p_status?: string }
        Returns: Json
      }
      manage_invite_user: {
        Args: {
          p_email: string
          p_roles: Database["public"]["Enums"]["app_role"][]
        }
        Returns: Json
      }
      manage_kyc_list: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: Json
      }
      manage_kyc_update_status: {
        Args: {
          p_new_status: string
          p_reason?: string
          p_verification_id: string
        }
        Returns: undefined
      }
      manage_list_invites: { Args: never; Returns: Json }
      manage_list_users: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      manage_list_users_lifecycle: {
        Args: {
          p_filter?: string
          p_limit?: number
          p_offset?: number
          p_status?: string
        }
        Returns: Json
      }
      manage_media_delete: { Args: { p_id: string }; Returns: string }
      manage_media_list: { Args: { p_search?: string }; Returns: Json }
      manage_media_update: {
        Args: { p_id: string; p_image_url: string }
        Returns: string
      }
      manage_news_articles: { Args: never; Returns: Json }
      manage_notifications_list: {
        Args: { p_limit?: number; p_status?: string }
        Returns: Json
      }
      manage_overview_stats: { Args: never; Returns: Json }
      manage_payments_overview: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: Json
      }
      manage_platform_alerts: { Args: never; Returns: Json }
      manage_quick_retrigger_kyc: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      manage_quick_retry_payment: {
        Args: { p_subscription_id: string }
        Returns: undefined
      }
      manage_quick_suspend_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      manage_recent_audit_logs: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      manage_reset_theme: { Args: { p_surface_id: string }; Returns: undefined }
      manage_resolve_alert: {
        Args: { p_alert_id: string; p_resolve?: boolean }
        Returns: undefined
      }
      manage_resolve_smart_alert: {
        Args: { p_alert_id: string }
        Returns: undefined
      }
      manage_save_explore_order: {
        Args: { p_orderings: Json }
        Returns: undefined
      }
      manage_searchable_entities: {
        Args: {
          p_entity_type?: string
          p_limit?: number
          p_offset?: number
          p_searchable_only?: boolean
        }
        Returns: {
          builder_surface_type: string
          cover_image_url: string
          created_at: string
          domain_host: string
          entity_subtype: string
          entity_type: string
          id: string
          industry: string
          is_ad_eligible: boolean
          is_published: boolean
          is_searchable: boolean
          is_verified: boolean
          primary_category: string
          published_at: string
          short_description: string
          slug: string
          surface_id: string
          surface_type: string
          tags: string[]
          title: string
          total_count: number
          visibility_tier: string
        }[]
      }
      manage_set_user_roles: {
        Args: {
          p_roles: Database["public"]["Enums"]["app_role"][]
          p_user_id: string
        }
        Returns: Json
      }
      manage_smart_alerts_list: {
        Args: { p_resolved?: boolean }
        Returns: Json
      }
      manage_subscription_action: {
        Args: { p_action: string; p_reason?: string; p_subscription_id: string }
        Returns: undefined
      }
      manage_support_reply: {
        Args: { p_content: string; p_ticket_id: string }
        Returns: undefined
      }
      manage_support_sla_list: { Args: { p_status?: string }; Returns: Json }
      manage_support_tickets_full: { Args: never; Returns: Json }
      manage_support_update_status: {
        Args: { p_status: string; p_ticket_id: string }
        Returns: undefined
      }
      manage_surface_action: {
        Args: { p_action: string; p_publish_id: string }
        Returns: string
      }
      manage_surfaces_list: { Args: never; Returns: Json }
      manage_surfaces_moderation: {
        Args: { p_filter?: string; p_search?: string }
        Returns: Json
      }
      manage_toggle_automation_rule: {
        Args: { p_enabled: boolean; p_rule_id: string }
        Returns: undefined
      }
      manage_toggle_feature_flag: {
        Args: { p_enabled: boolean; p_key: string }
        Returns: undefined
      }
      manage_toggle_featured: {
        Args: { p_app_id: string; p_featured: boolean }
        Returns: undefined
      }
      manage_toggle_integration: {
        Args: { p_app_id: string; p_status: string }
        Returns: undefined
      }
      manage_toggle_promo: {
        Args: { p_active: boolean; p_promo_id: string }
        Returns: undefined
      }
      manage_update_quota_config: {
        Args: {
          p_creator_limit?: number
          p_free_limit?: number
          p_is_enabled?: boolean
          p_key: string
          p_starter_limit?: number
        }
        Returns: undefined
      }
      manage_update_user_lifecycle: {
        Args: { p_action: string; p_user_id: string }
        Returns: Json
      }
      manage_user_full_lifecycle: { Args: { p_user_id: string }; Returns: Json }
      manage_user_lifecycle_stats: { Args: never; Returns: Json }
      manage_user_moderation_action: {
        Args: { p_action: string; p_user_id: string }
        Returns: string
      }
      modify_hub_booking: {
        Args: {
          p_booking_id: string
          p_date: string
          p_end: string
          p_notes?: string
          p_start: string
        }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      org_has_active_subscription: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      process_dropship_order_sync_batch: {
        Args: { p_limit?: number }
        Returns: Json
      }
      process_dropship_sync_batch: { Args: { p_limit?: number }; Returns: Json }
      publish_app_listing: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reap_stale_dropship_sync_jobs: { Args: never; Returns: number }
      refresh_banner_optimization_signals: { Args: never; Returns: undefined }
      refresh_entity_trust_score: {
        Args: { p_entity_id: string }
        Returns: undefined
      }
      refresh_exposure_tuning_signals: { Args: never; Returns: undefined }
      refund_credits: {
        Args: {
          p_amount: number
          p_note?: string
          p_ref_id: string
          p_ref_type: string
        }
        Returns: undefined
      }
      rename_surface: {
        Args: { p_new_title: string; p_surface_id: string }
        Returns: Json
      }
      replay_webhook_delivery: {
        Args: { p_delivery_id: string }
        Returns: string
      }
      request_payout: {
        Args: { p_agency_id: string; p_amount_cents: number }
        Returns: string
      }
      request_publish_surface:
        | { Args: { p_domain_id: string; p_surface_id: string }; Returns: Json }
        | {
            Args: { p_domain_id: string; p_slug?: string; p_surface_id: string }
            Returns: Json
          }
      require_app_scope: {
        Args: { p_app_id: string; p_scope_key: string }
        Returns: undefined
      }
      reserve_credits: {
        Args: { p_amount: number; p_ref_id: string; p_ref_type: string }
        Returns: undefined
      }
      resolve_route: { Args: { p_host: string; p_path: string }; Returns: Json }
      retry_webhook_delivery: {
        Args: { p_delivery_id: string }
        Returns: undefined
      }
      revoke_admin_invite: { Args: { p_invite_id: string }; Returns: undefined }
      rotate_app_key: { Args: { p_key_id: string }; Returns: Json }
      rotate_webhook_secret: { Args: { p_webhook_id: string }; Returns: string }
      run_auto_review: { Args: { p_listing_id: string }; Returns: string }
      search_entities: {
        Args: {
          p_category?: string
          p_entity_subtype?: string
          p_entity_type?: string
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_verified_only?: boolean
          p_visibility_tier?: string
        }
        Returns: {
          avatar_url: string
          avg_rating: number
          builder_surface_type: string
          cover_image_url: string
          domain_host: string
          entity_subtype: string
          entity_type: string
          id: string
          industry: string
          is_verified: boolean
          owner_display_name: string
          primary_category: string
          published_at: string
          relevance_score: number
          review_count: number
          short_description: string
          slug: string
          surface_type: string
          tags: string[]
          title: string
          trust_score: number
          visibility_tier: string
        }[]
      }
      search_public_profiles: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          avatar_emoji_key: string
          avatar_mode: string
          avatar_url: string
          business_name: string
          country: string
          creator_type: string
          display_name: string
          id: string
          username: string
          verified_tick: string
        }[]
      }
      send_admin_invite: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      set_dropship_provider_cooldown: {
        Args: { p_minutes?: number; p_provider_key: string }
        Returns: undefined
      }
      set_dropship_provider_token: {
        Args: {
          p_access_token: string
          p_expires_at: string
          p_provider_key: string
        }
        Returns: undefined
      }
      set_generation_status: {
        Args: {
          p_error?: string
          p_generation_id: string
          p_result_images?: Json
          p_status: string
        }
        Returns: undefined
      }
      set_listing_review_state: {
        Args: { p_listing_id: string; p_new_state: string; p_notes?: string }
        Returns: undefined
      }
      set_video_generation_status: {
        Args: {
          p_error?: string
          p_generation_id: string
          p_result_videos?: Json
          p_status: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      spend_credits: {
        Args: {
          _amount: number
          _description?: string
          _reference_id?: string
          _reference_type?: string
          _user_id: string
        }
        Returns: Json
      }
      submit_app_listing: { Args: { p_app_id: string }; Returns: undefined }
      submit_appeal: {
        Args: {
          p_evidence_links?: string[]
          p_listing_id: string
          p_message: string
        }
        Returns: string
      }
      sync_searchable_entity: {
        Args: { p_surface_id: string }
        Returns: undefined
      }
      track_order: {
        Args: { p_buyer_email: string; p_tracking_code: string }
        Returns: Json
      }
      unarchive_surface: { Args: { p_surface_id: string }; Returns: Json }
      unlist_from_community: { Args: { p_surface_id: string }; Returns: Json }
      unpublish_surface: {
        Args: { p_domain_id: string; p_surface_id: string }
        Returns: Json
      }
      update_dropship_order_result: {
        Args: {
          p_dropship_order_id: string
          p_last_error?: string
          p_provider_order_id?: string
          p_provider_payload?: Json
          p_status: string
        }
        Returns: undefined
      }
      upsert_creator_payment_profile: {
        Args: { p_methods: Json }
        Returns: undefined
      }
      upsert_fx_rate: {
        Args: {
          p_as_of?: string
          p_base_currency: string
          p_quote_currency: string
          p_rate: number
        }
        Returns: undefined
      }
      validate_widget_token: { Args: { p_token: string }; Returns: Json }
      verify_app_key: { Args: { p_plain_key: string }; Returns: Json }
    }
    Enums: {
      ad_status: "draft" | "pending_review" | "active" | "paused" | "rejected"
      agent_status: "draft" | "active" | "paused" | "archived"
      app_action_type: "install" | "connect" | "launch" | "generate" | "embed"
      app_pricing_type: "free" | "freemium" | "paid" | "enterprise"
      app_registry_status: "draft" | "active" | "hidden" | "archived"
      app_registry_type:
        | "native_app"
        | "connector_app"
        | "ai_generated_app"
        | "embedded_app"
        | "developer_app"
      app_role:
        | "admin"
        | "user"
        | "owner"
        | "manager"
        | "designer"
        | "agency_admin"
        | "agency_manager"
        | "foot_soldier"
        | "support"
        | "analyst"
        | "moderator"
        | "finance_officer"
        | "creator"
        | "influencer"
        | "engineer"
        | "sales_marketing"
        | "finance_lead"
        | "support_lead"
        | "social_digital"
      app_visibility: "public" | "private" | "internal"
      builder_surface_type:
        | "live_bio"
        | "live_selling"
        | "quick_site"
        | "emenu"
        | "eshop"
        | "community_group"
        | "store_listing"
        | "studio_showcase"
        | "community_listing"
      creator_type: "seller" | "builder" | "organization" | "learner"
      entity_subtype:
        | "influencer"
        | "freelancer"
        | "coach"
        | "consultant"
        | "leader"
        | "church"
        | "ministry"
        | "faith_org"
        | "ngo"
        | "school"
        | "institution"
        | "professional_network"
        | "general"
      kyc_status: "pending" | "submitted" | "approved" | "rejected"
      login_mode: "disabled" | "optional" | "required"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      searchable_entity_type:
        | "product"
        | "service"
        | "business"
        | "creator"
        | "organization"
        | "community"
        | "project"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "unpaid"
      surface_flag_status: "clean" | "flagged" | "featured" | "unpublished"
      surface_type: "shop" | "store" | "site" | "studio" | "live" | "community"
      visibility_tier: "free" | "verified" | "paid" | "premium"
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
      ad_status: ["draft", "pending_review", "active", "paused", "rejected"],
      agent_status: ["draft", "active", "paused", "archived"],
      app_action_type: ["install", "connect", "launch", "generate", "embed"],
      app_pricing_type: ["free", "freemium", "paid", "enterprise"],
      app_registry_status: ["draft", "active", "hidden", "archived"],
      app_registry_type: [
        "native_app",
        "connector_app",
        "ai_generated_app",
        "embedded_app",
        "developer_app",
      ],
      app_role: [
        "admin",
        "user",
        "owner",
        "manager",
        "designer",
        "agency_admin",
        "agency_manager",
        "foot_soldier",
        "support",
        "analyst",
        "moderator",
        "finance_officer",
        "creator",
        "influencer",
        "engineer",
        "sales_marketing",
        "finance_lead",
        "support_lead",
        "social_digital",
      ],
      app_visibility: ["public", "private", "internal"],
      builder_surface_type: [
        "live_bio",
        "live_selling",
        "quick_site",
        "emenu",
        "eshop",
        "community_group",
        "store_listing",
        "studio_showcase",
        "community_listing",
      ],
      creator_type: ["seller", "builder", "organization", "learner"],
      entity_subtype: [
        "influencer",
        "freelancer",
        "coach",
        "consultant",
        "leader",
        "church",
        "ministry",
        "faith_org",
        "ngo",
        "school",
        "institution",
        "professional_network",
        "general",
      ],
      kyc_status: ["pending", "submitted", "approved", "rejected"],
      login_mode: ["disabled", "optional", "required"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      searchable_entity_type: [
        "product",
        "service",
        "business",
        "creator",
        "organization",
        "community",
        "project",
      ],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "unpaid",
      ],
      surface_flag_status: ["clean", "flagged", "featured", "unpublished"],
      surface_type: ["shop", "store", "site", "studio", "live", "community"],
      visibility_tier: ["free", "verified", "paid", "premium"],
    },
  },
} as const
