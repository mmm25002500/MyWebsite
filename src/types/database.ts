/**
 * Supabase schema 型別。
 *
 * **本檔由 `supabase gen types typescript` 產生，請勿手動編輯（規格 §0.3）。**
 * schema 變更後重新產生：`pnpm db:types`
 */

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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_daily: {
        Row: {
          avg_duration_sec: number | null
          bounce_rate: number | null
          date: string
          page_type: string | null
          path: string
          sessions: number
          uniques: number
          views: number
        }
        Insert: {
          avg_duration_sec?: number | null
          bounce_rate?: number | null
          date: string
          page_type?: string | null
          path: string
          sessions?: number
          uniques?: number
          views?: number
        }
        Update: {
          avg_duration_sec?: number | null
          bounce_rate?: number | null
          date?: string
          page_type?: string | null
          path?: string
          sessions?: number
          uniques?: number
          views?: number
        }
        Relationships: []
      }
      analytics_daily_dimensions: {
        Row: {
          date: string
          dimension: string
          uniques: number
          value: string
          views: number
        }
        Insert: {
          date: string
          dimension: string
          uniques?: number
          value: string
          views?: number
        }
        Update: {
          date?: string
          dimension?: string
          uniques?: number
          value?: string
          views?: number
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          browser: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_sec: number | null
          entity_id: string | null
          id: number
          is_bounce: boolean | null
          locale: string | null
          os: string | null
          os_version: string | null
          page_type: string | null
          path: string
          referrer: string | null
          referrer_domain: string | null
          referrer_source: string | null
          screen_h: number | null
          screen_w: number | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_hash: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_sec?: number | null
          entity_id?: string | null
          id?: number
          is_bounce?: boolean | null
          locale?: string | null
          os?: string | null
          os_version?: string | null
          page_type?: string | null
          path: string
          referrer?: string | null
          referrer_domain?: string | null
          referrer_source?: string | null
          screen_h?: number | null
          screen_w?: number | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_hash: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_sec?: number | null
          entity_id?: string | null
          id?: number
          is_bounce?: boolean | null
          locale?: string | null
          os?: string | null
          os_version?: string | null
          page_type?: string | null
          path?: string
          referrer?: string | null
          referrer_domain?: string | null
          referrer_source?: string | null
          screen_h?: number | null
          screen_w?: number | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_hash?: string
        }
        Relationships: []
      }
      analytics_salt: {
        Row: {
          date: string
          salt: string
        }
        Insert: {
          date: string
          salt: string
        }
        Update: {
          date?: string
          salt?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_label: string | null
          entity_type: string | null
          id: number
          ip_hash: string | null
          severity: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: number
          ip_hash?: string | null
          severity?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: number
          ip_hash?: string | null
          severity?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_i18n: {
        Row: {
          category_id: string
          description: string | null
          locale: string
          name: string
        }
        Insert: {
          category_id: string
          description?: string | null
          locale: string
          name: string
        }
        Update: {
          category_id?: string
          description?: string | null
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_i18n_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expires_at: string | null
          file_url: string | null
          id: string
          is_visible: boolean
          issued_at: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expires_at?: string | null
          file_url?: string | null
          id?: string
          is_visible?: boolean
          issued_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expires_at?: string | null
          file_url?: string | null
          id?: string
          is_visible?: boolean
          issued_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      certifications_i18n: {
        Row: {
          certification_id: string
          description: string | null
          issuer: string
          locale: string
          name: string
        }
        Insert: {
          certification_id: string
          description?: string | null
          issuer: string
          locale: string
          name: string
        }
        Update: {
          certification_id?: string
          description?: string | null
          issuer?: string
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_i18n_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_entries: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          released_at: string
          sort_order: number
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          released_at: string
          sort_order?: number
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          released_at?: string
          sort_order?: number
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      changelog_entries_i18n: {
        Row: {
          entry_id: string
          items: Json
          locale: string
          title: string
        }
        Insert: {
          entry_id: string
          items?: Json
          locale: string
          title: string
        }
        Update: {
          entry_id?: string
          items?: Json
          locale?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "changelog_entries_i18n_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "changelog_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string | null
          reporter_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          content_html: string | null
          created_at: string
          edited_at: string | null
          id: string
          ip_hash: string | null
          is_pinned: boolean
          like_count: number
          parent_id: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          content_html?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          ip_hash?: string | null
          is_pinned?: boolean
          like_count?: number
          parent_id?: string | null
          status?: string
          target_id: string
          target_type?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          content_html?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          ip_hash?: string | null
          is_pinned?: boolean
          like_count?: number
          parent_id?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          admin_note: string | null
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          message: string
          name: string
          replied_at: string | null
          status: string
          subject: string
          type: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          message: string
          name: string
          replied_at?: string | null
          status?: string
          subject: string
          type?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          replied_at?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      content_revisions: {
        Row: {
          created_at: string
          edited_by: string | null
          entity_id: string
          entity_type: string
          id: string
          locale: string | null
          note: string | null
          snapshot: Json
        }
        Insert: {
          created_at?: string
          edited_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          locale?: string | null
          note?: string | null
          snapshot: Json
        }
        Update: {
          created_at?: string
          edited_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          locale?: string | null
          note?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_revisions_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      education: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_current: boolean
          is_visible: boolean
          logo_url: string | null
          sort_order: number
          started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_current?: boolean
          is_visible?: boolean
          logo_url?: string | null
          sort_order?: number
          started_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_current?: boolean
          is_visible?: boolean
          logo_url?: string | null
          sort_order?: number
          started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_i18n: {
        Row: {
          degree: string | null
          description_md: string | null
          education_id: string
          field: string | null
          locale: string
          school: string
        }
        Insert: {
          degree?: string | null
          description_md?: string | null
          education_id: string
          field?: string | null
          locale: string
          school: string
        }
        Update: {
          degree?: string | null
          description_md?: string | null
          education_id?: string
          field?: string | null
          locale?: string
          school?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_i18n_education_id_fkey"
            columns: ["education_id"]
            isOneToOne: false
            referencedRelation: "education"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          created_at: string
          employment_type: string
          ended_at: string | null
          id: string
          is_current: boolean
          is_visible: boolean
          logo_url: string | null
          organization_id: string | null
          show_company_name: boolean
          sort_order: number
          started_at: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          employment_type: string
          ended_at?: string | null
          id?: string
          is_current?: boolean
          is_visible?: boolean
          logo_url?: string | null
          organization_id?: string | null
          show_company_name?: boolean
          sort_order?: number
          started_at: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          employment_type?: string
          ended_at?: string | null
          id?: string
          is_current?: boolean
          is_visible?: boolean
          logo_url?: string | null
          organization_id?: string | null
          show_company_name?: boolean
          sort_order?: number
          started_at?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences_i18n: {
        Row: {
          company_name: string
          description_md: string | null
          experience_id: string
          highlights: Json
          locale: string
          location: string | null
          tech: string[]
          title: string
        }
        Insert: {
          company_name: string
          description_md?: string | null
          experience_id: string
          highlights?: Json
          locale: string
          location?: string | null
          tech?: string[]
          title: string
        }
        Update: {
          company_name?: string
          description_md?: string | null
          experience_id?: string
          highlights?: Json
          locale?: string
          location?: string | null
          tech?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_i18n_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      interests_i18n: {
        Row: {
          description: string | null
          interest_id: string
          locale: string
          title: string
        }
        Insert: {
          description?: string | null
          interest_id: string
          locale: string
          title: string
        }
        Update: {
          description?: string | null
          interest_id?: string
          locale?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_i18n_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
        ]
      }
      languages_spoken: {
        Row: {
          code: string
          created_at: string
          id: string
          is_visible: boolean
          proficiency: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_visible?: boolean
          proficiency: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          proficiency?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      languages_spoken_i18n: {
        Row: {
          language_id: string
          locale: string
          name: string
          note: string | null
        }
        Insert: {
          language_id: string
          locale: string
          name: string
          note?: string | null
        }
        Update: {
          language_id?: string
          locale?: string
          name?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "languages_spoken_i18n_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages_spoken"
            referencedColumns: ["id"]
          },
        ]
      }
      link_buttons: {
        Row: {
          bg_color: string | null
          click_count: number
          created_at: string
          group_id: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_highlighted: boolean
          is_visible: boolean
          sort_order: number
          text_color: string | null
          updated_at: string
          url: string
        }
        Insert: {
          bg_color?: string | null
          click_count?: number
          created_at?: string
          group_id?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_highlighted?: boolean
          is_visible?: boolean
          sort_order?: number
          text_color?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          bg_color?: string | null
          click_count?: number
          created_at?: string
          group_id?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_highlighted?: boolean
          is_visible?: boolean
          sort_order?: number
          text_color?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_buttons_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "link_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      link_buttons_i18n: {
        Row: {
          button_id: string
          description: string | null
          label: string
          locale: string
        }
        Insert: {
          button_id: string
          description?: string | null
          label: string
          locale: string
        }
        Update: {
          button_id?: string
          description?: string | null
          label?: string
          locale?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_buttons_i18n_button_id_fkey"
            columns: ["button_id"]
            isOneToOne: false
            referencedRelation: "link_buttons"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          button_id: string
          created_at: string
          id: string
          referrer: string | null
          visitor_hash: string | null
        }
        Insert: {
          button_id: string
          created_at?: string
          id?: string
          referrer?: string | null
          visitor_hash?: string | null
        }
        Update: {
          button_id?: string
          created_at?: string
          id?: string
          referrer?: string | null
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_button_id_fkey"
            columns: ["button_id"]
            isOneToOne: false
            referencedRelation: "link_buttons"
            referencedColumns: ["id"]
          },
        ]
      }
      link_groups: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      link_groups_i18n: {
        Row: {
          group_id: string
          locale: string
          name: string
        }
        Insert: {
          group_id: string
          locale: string
          name: string
        }
        Update: {
          group_id?: string
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_groups_i18n_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "link_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          bucket: string
          checksum: string | null
          created_at: string
          folder: string | null
          height: number | null
          id: string
          mime: string | null
          path: string
          size_bytes: number | null
          updated_at: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          bucket: string
          checksum?: string | null
          created_at?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime?: string | null
          path: string
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          bucket?: string
          checksum?: string | null
          created_at?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime?: string | null
          path?: string
          size_bytes?: number | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      media_i18n: {
        Row: {
          alt: string | null
          caption: string | null
          locale: string
          media_id: string
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          locale: string
          media_id: string
        }
        Update: {
          alt?: string | null
          caption?: string | null
          locale?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_i18n_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          ended_at: string | null
          github_org: string | null
          id: string
          is_visible: boolean
          logo_url: string | null
          slug: string
          sort_order: number
          started_at: string | null
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          github_org?: string | null
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          slug: string
          sort_order?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          github_org?: string | null
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          slug?: string
          sort_order?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      organizations_i18n: {
        Row: {
          description_html: string | null
          description_md: string | null
          locale: string
          name: string
          org_id: string
          role: string
        }
        Insert: {
          description_html?: string | null
          description_md?: string | null
          locale: string
          name: string
          org_id: string
          role: string
        }
        Update: {
          description_html?: string | null
          description_md?: string | null
          locale?: string
          name?: string
          org_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_i18n_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_visible: boolean
          page_slug: string
          section_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_slug: string
          section_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_slug?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_sections_i18n: {
        Row: {
          locale: string
          section_id: string
          subtitle: string | null
          title: string | null
        }
        Insert: {
          locale: string
          section_id: string
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          locale?: string
          section_id?: string
          subtitle?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_i18n_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "page_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pages_i18n: {
        Row: {
          content_html: string | null
          content_md: string | null
          content_text: string | null
          created_at: string
          locale: string
          page_id: string
          seo_description: string | null
          seo_title: string | null
          title: string
          toc: Json | null
          updated_at: string
        }
        Insert: {
          content_html?: string | null
          content_md?: string | null
          content_text?: string | null
          created_at?: string
          locale: string
          page_id: string
          seo_description?: string | null
          seo_title?: string | null
          title: string
          toc?: Json | null
          updated_at?: string
        }
        Update: {
          content_html?: string | null
          content_md?: string | null
          content_text?: string | null
          created_at?: string
          locale?: string
          page_id?: string
          seo_description?: string | null
          seo_title?: string | null
          title?: string
          toc?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_i18n_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      post_categories: {
        Row: {
          category_id: string
          is_primary: boolean
          post_id: string
        }
        Insert: {
          category_id: string
          is_primary?: boolean
          post_id: string
        }
        Update: {
          category_id?: string
          is_primary?: boolean
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string | null
          visitor_hash: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id?: string | null
          visitor_hash: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string | null
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_public_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_related: {
        Row: {
          post_id: string
          related_post_id: string
          sort_order: number
        }
        Insert: {
          post_id: string
          related_post_id: string
          sort_order?: number
        }
        Update: {
          post_id?: string
          related_post_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_related_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_related_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_public_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_related_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_related_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "v_public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_public_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          allow_comments: boolean
          canonical_url: string | null
          comment_count: number
          cover_url: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_pinned: boolean
          like_count: number
          meta: Json
          og_image_url: string | null
          preview_token: string
          published_at: string | null
          series_id: string | null
          series_order: number | null
          slug: string
          status: string
          updated_at: string
          view_count: number
        }
        Insert: {
          allow_comments?: boolean
          canonical_url?: string | null
          comment_count?: number
          cover_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          like_count?: number
          meta?: Json
          og_image_url?: string | null
          preview_token?: string
          published_at?: string | null
          series_id?: string | null
          series_order?: number | null
          slug: string
          status?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          allow_comments?: boolean
          canonical_url?: string | null
          comment_count?: number
          cover_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          like_count?: number
          meta?: Json
          og_image_url?: string | null
          preview_token?: string
          published_at?: string | null
          series_id?: string | null
          series_order?: number | null
          slug?: string
          status?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_i18n: {
        Row: {
          content_html: string | null
          content_md: string | null
          content_text: string | null
          created_at: string
          excerpt: string | null
          locale: string
          post_id: string
          reading_time_min: number | null
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          subtitle: string | null
          title: string
          toc: Json | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          content_html?: string | null
          content_md?: string | null
          content_text?: string | null
          created_at?: string
          excerpt?: string | null
          locale: string
          post_id: string
          reading_time_min?: number | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          subtitle?: string | null
          title: string
          toc?: Json | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          content_html?: string | null
          content_md?: string | null
          content_text?: string | null
          created_at?: string
          excerpt?: string | null
          locale?: string
          post_id?: string
          reading_time_min?: number | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          subtitle?: string | null
          title?: string
          toc?: Json | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_i18n_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_i18n_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_public_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_source: string
          avatar_url: string | null
          ban_reason: string | null
          banned_until: string | null
          bio: string | null
          created_at: string
          display_name: string
          is_banned: boolean
          last_seen_at: string | null
          notify_reply: boolean
          role: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_source?: string
          avatar_url?: string | null
          ban_reason?: string | null
          banned_until?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          is_banned?: boolean
          last_seen_at?: string | null
          notify_reply?: boolean
          role?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_source?: string
          avatar_url?: string | null
          ban_reason?: string | null
          banned_until?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          is_banned?: boolean
          last_seen_at?: string | null
          notify_reply?: boolean
          role?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      project_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_categories_i18n: {
        Row: {
          category_id: string
          description: string | null
          locale: string
          name: string
        }
        Insert: {
          category_id: string
          description?: string | null
          locale: string
          name: string
        }
        Update: {
          category_id?: string
          description?: string | null
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_categories_i18n_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images: {
        Row: {
          created_at: string
          height: number | null
          id: string
          is_cover: boolean
          project_id: string
          sort_order: number
          thumbnail_url: string | null
          updated_at: string
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          project_id: string
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          project_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_public_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images_i18n: {
        Row: {
          alt: string | null
          caption: string | null
          image_id: string
          locale: string
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          image_id: string
          locale: string
        }
        Update: {
          alt?: string | null
          caption?: string | null
          image_id?: string
          locale?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_i18n_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "project_images"
            referencedColumns: ["id"]
          },
        ]
      }
      project_links: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          project_id: string
          sort_order: number
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          project_id: string
          sort_order?: number
          type?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          project_id?: string
          sort_order?: number
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_public_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_links_i18n: {
        Row: {
          label: string
          link_id: string
          locale: string
        }
        Insert: {
          label: string
          link_id: string
          locale: string
        }
        Update: {
          label?: string
          link_id?: string
          locale?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_links_i18n_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "project_links"
            referencedColumns: ["id"]
          },
        ]
      }
      project_posts: {
        Row: {
          post_id: string
          project_id: string
          sort_order: number
        }
        Insert: {
          post_id: string
          project_id: string
          sort_order?: number
        }
        Update: {
          post_id?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_public_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_public_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          project_id: string
          tag_id: string
        }
        Insert: {
          project_id: string
          tag_id: string
        }
        Update: {
          project_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_public_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          allow_comments: boolean
          category_id: string | null
          cover_url: string | null
          created_at: string
          ended_at: string | null
          forks: number | null
          github_repo: string | null
          id: string
          is_featured: boolean
          is_visible: boolean
          last_pushed_at: string | null
          metrics: Json
          organization_id: string | null
          primary_language: string | null
          slug: string
          sort_order: number
          stars: number | null
          started_at: string
          status: string
          updated_at: string
          view_count: number
        }
        Insert: {
          allow_comments?: boolean
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          ended_at?: string | null
          forks?: number | null
          github_repo?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          last_pushed_at?: string | null
          metrics?: Json
          organization_id?: string | null
          primary_language?: string | null
          slug: string
          sort_order?: number
          stars?: number | null
          started_at: string
          status?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          allow_comments?: boolean
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          ended_at?: string | null
          forks?: number | null
          github_repo?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          last_pushed_at?: string | null
          metrics?: Json
          organization_id?: string | null
          primary_language?: string | null
          slug?: string
          sort_order?: number
          stars?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_i18n: {
        Row: {
          content_html: string | null
          content_md: string | null
          content_text: string | null
          created_at: string
          locale: string
          name: string
          project_id: string
          role: string | null
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          summary: string | null
          tagline: string | null
          toc: Json | null
          updated_at: string
        }
        Insert: {
          content_html?: string | null
          content_md?: string | null
          content_text?: string | null
          created_at?: string
          locale: string
          name: string
          project_id: string
          role?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          summary?: string | null
          tagline?: string | null
          toc?: Json | null
          updated_at?: string
        }
        Update: {
          content_html?: string | null
          content_md?: string | null
          content_text?: string | null
          created_at?: string
          locale?: string
          name?: string
          project_id?: string
          role?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          summary?: string | null
          tagline?: string | null
          toc?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_i18n_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_i18n_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_public_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      redirects: {
        Row: {
          created_at: string
          from_path: string
          hit_count: number
          id: string
          is_active: boolean
          reason: string | null
          status_code: number
          to_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_path: string
          hit_count?: number
          id?: string
          is_active?: boolean
          reason?: string | null
          status_code?: number
          to_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_path?: string
          hit_count?: number
          id?: string
          is_active?: boolean
          reason?: string | null
          status_code?: number
          to_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          is_visible: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      series_i18n: {
        Row: {
          description: string | null
          locale: string
          series_id: string
          title: string
        }
        Insert: {
          description?: string | null
          locale: string
          series_id: string
          title: string
        }
        Update: {
          description?: string | null
          locale?: string
          series_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_i18n_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skill_groups: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      skill_groups_i18n: {
        Row: {
          description: string | null
          group_id: string
          locale: string
          name: string
        }
        Insert: {
          description?: string | null
          group_id: string
          locale: string
          name: string
        }
        Update: {
          description?: string | null
          group_id?: string
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_groups_i18n_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "skill_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          group_id: string
          icon: string | null
          id: string
          is_primary: boolean
          is_visible: boolean
          level: number | null
          name: string
          show_on_home: boolean
          sort_order: number
          updated_at: string
          years: number | null
        }
        Insert: {
          created_at?: string
          group_id: string
          icon?: string | null
          id?: string
          is_primary?: boolean
          is_visible?: boolean
          level?: number | null
          name: string
          show_on_home?: boolean
          sort_order?: number
          updated_at?: string
          years?: number | null
        }
        Update: {
          created_at?: string
          group_id?: string
          icon?: string | null
          id?: string
          is_primary?: boolean
          is_visible?: boolean
          level?: number | null
          name?: string
          show_on_home?: boolean
          sort_order?: number
          updated_at?: string
          years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "skill_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_methods: {
        Row: {
          address_or_url: string
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          key: string
          network: string | null
          qr_image_url: string | null
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          address_or_url: string
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          key: string
          network?: string | null
          qr_image_url?: string | null
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          address_or_url?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          key?: string
          network?: string | null
          qr_image_url?: string | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsor_methods_i18n: {
        Row: {
          label: string
          locale: string
          method_id: string
          note: string | null
        }
        Insert: {
          label: string
          locale: string
          method_id: string
          note?: string | null
        }
        Update: {
          label?: string
          locale?: string
          method_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_methods_i18n_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "sponsor_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          amount_note: string | null
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          is_anonymous: boolean
          is_visible: boolean
          sort_order: number
          sponsored_at: string | null
          tier: string
          updated_at: string
          url: string | null
        }
        Insert: {
          amount_note?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_anonymous?: boolean
          is_visible?: boolean
          sort_order?: number
          sponsored_at?: string | null
          tier?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          amount_note?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          is_visible?: boolean
          sort_order?: number
          sponsored_at?: string | null
          tier?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      sponsors_i18n: {
        Row: {
          locale: string
          message: string | null
          sponsor_id: string
        }
        Insert: {
          locale: string
          message?: string | null
          sponsor_id: string
        }
        Update: {
          locale?: string
          message?: string | null
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_i18n_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          confirm_token: string | null
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          locale: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirm_token?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          locale?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirm_token?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          post_count: number
          project_count: number
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          post_count?: number
          project_count?: number
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          post_count?: number
          project_count?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags_i18n: {
        Row: {
          locale: string
          name: string
          tag_id: string
        }
        Insert: {
          locale: string
          name: string
          tag_id: string
        }
        Update: {
          locale?: string
          name?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_i18n_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          branch: string
          color: string | null
          created_at: string
          end_date: string | null
          event_date: string
          icon: string | null
          id: string
          image_url: string | null
          is_milestone: boolean
          is_visible: boolean
          link_url: string | null
          related_org_id: string | null
          related_post_id: string | null
          related_project_id: string | null
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          branch?: string
          color?: string | null
          created_at?: string
          end_date?: string | null
          event_date: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_milestone?: boolean
          is_visible?: boolean
          link_url?: string | null
          related_org_id?: string | null
          related_post_id?: string | null
          related_project_id?: string | null
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          branch?: string
          color?: string | null
          created_at?: string
          end_date?: string | null
          event_date?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_milestone?: boolean
          is_visible?: boolean
          link_url?: string | null
          related_org_id?: string | null
          related_post_id?: string | null
          related_project_id?: string | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_related_org_id_fkey"
            columns: ["related_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "v_public_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "v_public_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events_i18n: {
        Row: {
          description: string | null
          event_id: string
          locale: string
          subtitle: string | null
          title: string
        }
        Insert: {
          description?: string | null
          event_id: string
          locale: string
          subtitle?: string | null
          title: string
        }
        Update: {
          description?: string | null
          event_id?: string
          locale?: string
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_i18n_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          banned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_sessions_meta: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_hash: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_meta_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      video_meta: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_hidden: boolean
          sort_order: number
          updated_at: string
          youtube_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          sort_order?: number
          updated_at?: string
          youtube_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          sort_order?: number
          updated_at?: string
          youtube_id?: string
        }
        Relationships: []
      }
      video_meta_i18n: {
        Row: {
          description_override: string | null
          locale: string
          title_override: string | null
          video_meta_id: string
        }
        Insert: {
          description_override?: string | null
          locale: string
          title_override?: string | null
          video_meta_id: string
        }
        Update: {
          description_override?: string | null
          locale?: string
          title_override?: string | null
          video_meta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_meta_i18n_video_meta_id_fkey"
            columns: ["video_meta_id"]
            isOneToOne: false
            referencedRelation: "video_meta"
            referencedColumns: ["id"]
          },
        ]
      }
      view_dedup: {
        Row: {
          entity_id: string
          entity_type: string
          viewed_at: string
          visitor_hash: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          viewed_at?: string
          visitor_hash: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          viewed_at?: string
          visitor_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_public_posts: {
        Row: {
          allow_comments: boolean | null
          available_locales: unknown[] | null
          canonical_url: string | null
          categories: Json | null
          category_slugs: string[] | null
          comment_count: number | null
          content_html: string | null
          cover_url: string | null
          excerpt: string | null
          id: string | null
          is_featured: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          locale: string | null
          og_image_url: string | null
          primary_category_slug: string | null
          published_at: string | null
          reading_time_min: number | null
          seo_description: string | null
          seo_title: string | null
          series_id: string | null
          series_order: number | null
          series_slug: string | null
          slug: string | null
          subtitle: string | null
          tag_slugs: string[] | null
          tags: Json | null
          title: string | null
          toc: Json | null
          updated_at: string | null
          view_count: number | null
          word_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      v_public_projects: {
        Row: {
          allow_comments: boolean | null
          category_name: string | null
          category_slug: string | null
          content_html: string | null
          cover_url: string | null
          ended_at: string | null
          forks: number | null
          github_repo: string | null
          id: string | null
          is_featured: boolean | null
          locale: string | null
          metrics: Json | null
          name: string | null
          organization_name: string | null
          organization_slug: string | null
          primary_language: string | null
          role: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          sort_order: number | null
          stars: number | null
          started_at: string | null
          status: string | null
          summary: string | null
          tag_slugs: string[] | null
          tagline: string | null
          tags: Json | null
          toc: Json | null
          updated_at: string | null
          view_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_role: { Args: never; Returns: string }
      create_comment: {
        Args: {
          p_content: string
          p_ip?: string
          p_parent_id?: string
          p_target_id: string
          p_target_type: string
          p_user_agent?: string
        }
        Returns: string
      }
      current_analytics_salt: { Args: never; Returns: string }
      get_related_posts: {
        Args: { p_limit?: number; p_locale?: string; p_post_id: string }
        Returns: {
          id: string
          shared_tags: number
          slug: string
          title: string
        }[]
      }
      increment_view: {
        Args: {
          p_id: string
          p_ip: string
          p_type: string
          p_user_agent: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      prune_analytics: { Args: { p_days?: number }; Returns: undefined }
      record_duration: {
        Args: { p_duration_sec: number; p_path: string; p_session_id: string }
        Returns: undefined
      }
      record_pageview: {
        Args: {
          p_browser?: string
          p_browser_version?: string
          p_city?: string
          p_country?: string
          p_device_type?: string
          p_entity_id?: string
          p_ip: string
          p_locale?: string
          p_os?: string
          p_os_version?: string
          p_page_type?: string
          p_path: string
          p_referrer?: string
          p_referrer_domain?: string
          p_referrer_source?: string
          p_screen_h?: number
          p_screen_w?: number
          p_session_id: string
          p_user_agent: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: undefined
      }
      rollup_analytics: { Args: { p_date: string }; Returns: undefined }
      rotate_analytics_salt: { Args: never; Returns: undefined }
      search_all: {
        Args: {
          p_limit?: number
          p_locale?: string
          p_offset?: number
          q: string
        }
        Returns: {
          categories: string[]
          date: string
          id: string
          score: number
          slug: string
          snippet: string
          title: string
          type: string
        }[]
      }
      toggle_like: {
        Args: {
          p_ip: string
          p_liked?: boolean
          p_post_id: string
          p_user_agent: string
          p_user_id?: string
        }
        Returns: number
      }
      write_audit_log: {
        Args: {
          p_action: string
          p_diff?: Json
          p_entity_id?: string
          p_entity_label?: string
          p_entity_type?: string
          p_ip_hash?: string
          p_severity?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
