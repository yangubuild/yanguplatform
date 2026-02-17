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
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
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
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          id: string
          name: string
          owner_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_user_id?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          country: string | null
          created_at: string
          creator_type: Database["public"]["Enums"]["creator_type"] | null
          display_name: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          country?: string | null
          created_at?: string
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
          display_name?: string | null
          id: string
          onboarding_completed?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          country?: string | null
          created_at?: string
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
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
      add_credits: {
        Args: {
          _amount: number
          _description?: string
          _transaction_type?: string
          _user_id: string
        }
        Returns: Json
      }
      admin_grant_credits_by_email: {
        Args: { p_amount: number; p_email: string; p_note?: string }
        Returns: undefined
      }
      admin_reset_user_onboarding: {
        Args: { p_email: string }
        Returns: undefined
      }
      archive_surface: { Args: { p_surface_id: string }; Returns: Json }
      can_list_on_community: {
        Args: { p_surface_id: string }
        Returns: boolean
      }
      can_publish_surface: {
        Args: { _surface_id: string; _user_id: string }
        Returns: boolean
      }
      charge_reserved: {
        Args: { p_amount: number; p_ref_id: string; p_ref_type: string }
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
      consume_entitlement: {
        Args: { p_amount?: number; p_asset_type: string }
        Returns: undefined
      }
      count_org_active_publishes: {
        Args: { p_org_id: string }
        Returns: number
      }
      count_published_surfaces: { Args: { _user_id: string }; Returns: number }
      create_creatify_generation: {
        Args: { p_cost_credits?: number; p_params?: Json; p_prompt: string }
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
      delete_surface: { Args: { p_surface_id: string }; Returns: Json }
      dismiss_promo: { Args: { p_campaign_key: string }; Returns: undefined }
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
      get_default_domain_for_creator: {
        Args: { _creator_type: Database["public"]["Enums"]["creator_type"] }
        Returns: string
      }
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
      get_my_credit_balance: { Args: never; Returns: number }
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
      get_published_surface: {
        Args: { p_publish_id?: string; p_surface_id?: string }
        Returns: Json
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
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_slug_available: {
        Args: { _domain_id: string; _slug: string }
        Returns: boolean
      }
      is_username_available: { Args: { _username: string }; Returns: boolean }
      list_on_community: { Args: { p_surface_id: string }; Returns: Json }
      org_has_active_subscription: {
        Args: { p_org_id: string }
        Returns: boolean
      }
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
      request_publish_surface:
        | { Args: { p_domain_id: string; p_surface_id: string }; Returns: Json }
        | {
            Args: { p_domain_id: string; p_slug?: string; p_surface_id: string }
            Returns: Json
          }
      reserve_credits: {
        Args: { p_amount: number; p_ref_id: string; p_ref_type: string }
        Returns: undefined
      }
      resolve_route: { Args: { p_host: string; p_path: string }; Returns: Json }
      revoke_admin_invite: { Args: { p_invite_id: string }; Returns: undefined }
      send_admin_invite: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
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
      set_video_generation_status: {
        Args: {
          p_error?: string
          p_generation_id: string
          p_result_videos?: Json
          p_status: string
        }
        Returns: undefined
      }
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
      unarchive_surface: { Args: { p_surface_id: string }; Returns: Json }
      unlist_from_community: { Args: { p_surface_id: string }; Returns: Json }
      unpublish_surface: {
        Args: { p_domain_id: string; p_surface_id: string }
        Returns: Json
      }
    }
    Enums: {
      ad_status: "draft" | "pending_review" | "active" | "paused" | "rejected"
      agent_status: "draft" | "active" | "paused" | "archived"
      app_role: "admin" | "user" | "owner" | "manager" | "designer"
      creator_type: "seller" | "builder" | "organization" | "learner"
      kyc_status: "pending" | "submitted" | "approved" | "rejected"
      login_mode: "disabled" | "optional" | "required"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "unpaid"
      surface_type: "shop" | "store" | "site" | "studio" | "live" | "community"
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
      app_role: ["admin", "user", "owner", "manager", "designer"],
      creator_type: ["seller", "builder", "organization", "learner"],
      kyc_status: ["pending", "submitted", "approved", "rejected"],
      login_mode: ["disabled", "optional", "required"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "unpaid",
      ],
      surface_type: ["shop", "store", "site", "studio", "live", "community"],
    },
  },
} as const
