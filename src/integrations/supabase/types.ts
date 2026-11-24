// ATENÇÃO: escrito à mão no formato do `supabase gen types typescript`.
// Reflete supabase/migrations/20261124000100..0600. Depois de aplicar as migrations
// no projeto Supabase, REGENERE este arquivo (ele será sobrescrito):
//   supabase gen types typescript --project-id <ref> --schema public > src/integrations/supabase/types.ts
// Tipos de retorno estruturados das RPCs ficam em ./rpc-types.ts (não são sobrescritos).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      acquisition_channels: {
        Row: {
          id: number;
          code: string;
          name: string;
          utm_aliases: string[];
          is_paid: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          code: string;
          name: string;
          utm_aliases?: string[];
          is_paid?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          code?: string;
          name?: string;
          utm_aliases?: string[];
          is_paid?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessment_results: {
        Row: {
          id: number;
          assessment_id: number;
          scores: Json;
          primary_type: string;
          scoring_version: string | null;
          computed_at: string;
        };
        Insert: {
          id?: never;
          assessment_id: number;
          scores: Json;
          primary_type: string;
          scoring_version?: string | null;
          computed_at?: string;
        };
        Update: {
          id?: never;
          assessment_id?: number;
          scores?: Json;
          primary_type?: string;
          scoring_version?: string | null;
          computed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: true;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          id: number;
          user_id: string | null;
          contact_id: number | null;
          anonymous_id: string | null;
          instrument: string;
          status: "in_progress" | "completed" | "abandoned";
          started_at: string;
          completed_at: string | null;
          answered_count: number;
          answers: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          user_id?: string | null;
          contact_id?: number | null;
          anonymous_id?: string | null;
          instrument: string;
          status?: "in_progress" | "completed" | "abandoned";
          started_at?: string;
          completed_at?: string | null;
          answered_count?: number;
          answers?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string | null;
          contact_id?: number | null;
          anonymous_id?: string | null;
          instrument?: string;
          status?: "in_progress" | "completed" | "abandoned";
          started_at?: string;
          completed_at?: string | null;
          answered_count?: number;
          answers?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: number;
          at: string;
          actor_id: string | null;
          action: "insert" | "update" | "delete";
          entity_table: string;
          entity_id: string | null;
          diff: Json | null;
        };
        Insert: {
          id?: never;
          at?: string;
          actor_id?: string | null;
          action: "insert" | "update" | "delete";
          entity_table: string;
          entity_id?: string | null;
          diff?: Json | null;
        };
        Update: {
          id?: never;
          at?: string;
          actor_id?: string | null;
          action?: "insert" | "update" | "delete";
          entity_table?: string;
          entity_id?: string | null;
          diff?: Json | null;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: number;
          channel_id: number;
          name: string;
          utm_campaign: string | null;
          starts_on: string | null;
          ends_on: string | null;
          status: "draft" | "active" | "paused" | "ended";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          channel_id: number;
          name: string;
          utm_campaign?: string | null;
          starts_on?: string | null;
          ends_on?: string | null;
          status?: "draft" | "active" | "paused" | "ended";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          channel_id?: number;
          name?: string;
          utm_campaign?: string | null;
          starts_on?: string | null;
          ends_on?: string | null;
          status?: "draft" | "active" | "paused" | "ended";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "acquisition_channels";
            referencedColumns: ["id"];
          },
        ];
      };
      consents: {
        Row: {
          id: number;
          contact_id: number;
          consent_type: Database["public"]["Enums"]["consent_type"];
          document_version: string;
          granted: boolean;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          contact_id: number;
          consent_type: Database["public"]["Enums"]["consent_type"];
          document_version: string;
          granted: boolean;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          contact_id?: number;
          consent_type?: Database["public"]["Enums"]["consent_type"];
          document_version?: string;
          granted?: boolean;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consents_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_contact_tags: {
        Row: {
          contact_id: number;
          tag_id: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          contact_id: number;
          tag_id: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          contact_id?: number;
          tag_id?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_contact_tags_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contact_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_contacts: {
        Row: {
          id: number;
          user_id: string | null;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          stage: Database["public"]["Enums"]["crm_stage"];
          first_touch_at: string | null;
          first_channel_id: number | null;
          first_campaign_id: number | null;
          first_landing_page_id: number | null;
          first_utm_source: string | null;
          first_utm_medium: string | null;
          first_utm_campaign: string | null;
          first_utm_content: string | null;
          first_utm_term: string | null;
          last_touch_at: string | null;
          last_channel_id: number | null;
          last_campaign_id: number | null;
          last_landing_page_id: number | null;
          last_utm_source: string | null;
          last_utm_medium: string | null;
          last_utm_campaign: string | null;
          last_utm_content: string | null;
          last_utm_term: string | null;
          last_interaction_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        // Staff só pode inserir/atualizar as colunas liberadas por GRANT de coluna
        // (ver migration 0200); o restante é escrito por capture_lead()/triggers.
        Insert: {
          id?: never;
          user_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          stage?: Database["public"]["Enums"]["crm_stage"];
          first_touch_at?: string | null;
          first_channel_id?: number | null;
          first_campaign_id?: number | null;
          first_landing_page_id?: number | null;
          first_utm_source?: string | null;
          first_utm_medium?: string | null;
          first_utm_campaign?: string | null;
          first_utm_content?: string | null;
          first_utm_term?: string | null;
          last_touch_at?: string | null;
          last_channel_id?: number | null;
          last_campaign_id?: number | null;
          last_landing_page_id?: number | null;
          last_utm_source?: string | null;
          last_utm_medium?: string | null;
          last_utm_campaign?: string | null;
          last_utm_content?: string | null;
          last_utm_term?: string | null;
          last_interaction_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          stage?: Database["public"]["Enums"]["crm_stage"];
          first_touch_at?: string | null;
          first_channel_id?: number | null;
          first_campaign_id?: number | null;
          first_landing_page_id?: number | null;
          first_utm_source?: string | null;
          first_utm_medium?: string | null;
          first_utm_campaign?: string | null;
          first_utm_content?: string | null;
          first_utm_term?: string | null;
          last_touch_at?: string | null;
          last_channel_id?: number | null;
          last_campaign_id?: number | null;
          last_landing_page_id?: number | null;
          last_utm_source?: string | null;
          last_utm_medium?: string | null;
          last_utm_campaign?: string | null;
          last_utm_content?: string | null;
          last_utm_term?: string | null;
          last_interaction_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_contacts_first_channel_id_fkey";
            columns: ["first_channel_id"];
            isOneToOne: false;
            referencedRelation: "acquisition_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_first_campaign_id_fkey";
            columns: ["first_campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_first_landing_page_id_fkey";
            columns: ["first_landing_page_id"];
            isOneToOne: false;
            referencedRelation: "landing_pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_last_channel_id_fkey";
            columns: ["last_channel_id"];
            isOneToOne: false;
            referencedRelation: "acquisition_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_last_campaign_id_fkey";
            columns: ["last_campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_last_landing_page_id_fkey";
            columns: ["last_landing_page_id"];
            isOneToOne: false;
            referencedRelation: "landing_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_interactions: {
        Row: {
          id: number;
          contact_id: number;
          interaction_type: "note" | "call" | "message" | "email" | "meeting" | "other";
          channel: "whatsapp" | "email" | "phone" | "instagram_dm" | "in_person" | "other" | null;
          content: string;
          author_id: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          contact_id: number;
          interaction_type: "note" | "call" | "message" | "email" | "meeting" | "other";
          channel?: "whatsapp" | "email" | "phone" | "instagram_dm" | "in_person" | "other" | null;
          content: string;
          author_id?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          contact_id?: number;
          interaction_type?: "note" | "call" | "message" | "email" | "meeting" | "other";
          channel?: "whatsapp" | "email" | "phone" | "instagram_dm" | "in_person" | "other" | null;
          content?: string;
          author_id?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_interactions_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_stage_history: {
        Row: {
          id: number;
          contact_id: number;
          from_stage: Database["public"]["Enums"]["crm_stage"] | null;
          to_stage: Database["public"]["Enums"]["crm_stage"];
          changed_by: string | null;
          changed_at: string;
          reason: string | null;
        };
        Insert: {
          id?: never;
          contact_id: number;
          from_stage?: Database["public"]["Enums"]["crm_stage"] | null;
          to_stage: Database["public"]["Enums"]["crm_stage"];
          changed_by?: string | null;
          changed_at?: string;
          reason?: string | null;
        };
        Update: {
          id?: never;
          contact_id?: number;
          from_stage?: Database["public"]["Enums"]["crm_stage"] | null;
          to_stage?: Database["public"]["Enums"]["crm_stage"];
          changed_by?: string | null;
          changed_at?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_stage_history_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      event_types: {
        Row: {
          name: string;
          description: string | null;
          funnel_stage: Database["public"]["Enums"]["crm_stage"] | null;
          funnel_order: number | null;
          touches_contact: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          funnel_stage?: Database["public"]["Enums"]["crm_stage"] | null;
          funnel_order?: number | null;
          touches_contact?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          funnel_stage?: Database["public"]["Enums"]["crm_stage"] | null;
          funnel_order?: number | null;
          touches_contact?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: number;
          occurred_at: string;
          event_name: string;
          contact_id: number | null;
          user_id: string | null;
          anonymous_id: string | null;
          session_id: string | null;
          channel_id: number | null;
          campaign_id: number | null;
          landing_page_id: number | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          properties: Json;
        };
        // Append-only: escrita apenas via track_event()/capture_lead() (service role).
        Insert: {
          id?: never;
          occurred_at?: string;
          event_name: string;
          contact_id?: number | null;
          user_id?: string | null;
          anonymous_id?: string | null;
          session_id?: string | null;
          channel_id?: number | null;
          campaign_id?: number | null;
          landing_page_id?: number | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          properties?: Json;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "events_event_name_fkey";
            columns: ["event_name"];
            isOneToOne: false;
            referencedRelation: "event_types";
            referencedColumns: ["name"];
          },
          {
            foreignKeyName: "events_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "acquisition_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_landing_page_id_fkey";
            columns: ["landing_page_id"];
            isOneToOne: false;
            referencedRelation: "landing_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      landing_pages: {
        Row: {
          id: number;
          slug: string;
          name: string;
          path: string | null;
          campaign_id: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          slug: string;
          name: string;
          path?: string | null;
          campaign_id?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          slug?: string;
          name?: string;
          path?: string | null;
          campaign_id?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "landing_pages_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_spend: {
        Row: {
          id: number;
          spend_date: string;
          channel_id: number;
          campaign_id: number | null;
          amount: number;
          currency: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          spend_date: string;
          channel_id: number;
          campaign_id?: number | null;
          amount: number;
          currency?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          spend_date?: string;
          channel_id?: number;
          campaign_id?: number | null;
          amount?: number;
          currency?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_spend_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "acquisition_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_spend_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          id: number;
          code: string;
          name: string;
          description: string | null;
          price: number;
          currency: string;
          billing_interval: "monthly" | "quarterly" | "yearly" | "one_time";
          limits: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          code: string;
          name: string;
          description?: string | null;
          price: number;
          currency?: string;
          billing_interval: "monthly" | "quarterly" | "yearly" | "one_time";
          limits?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          code?: string;
          name?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          billing_interval?: "monthly" | "quarterly" | "yearly" | "one_time";
          limits?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          locale: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        // Cliente só atualiza full_name, avatar_url, locale, timezone (GRANT de coluna).
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: number;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          name: string;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          name?: string;
          color?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: number;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          granted_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          granted_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_dashboard_metrics: {
        Args: {
          p_from: string;
          p_to: string;
          p_currency?: string;
          p_active_window_days?: number;
        };
        Returns: Json;
      };
      admin_funnel: {
        Args: { p_from: string; p_to: string };
        Returns: {
          step: string;
          step_order: number;
          unique_actors: number;
          total_events: number;
          conversion_from_previous: number | null;
        }[];
      };
      admin_new_users_series: {
        Args: { p_from: string; p_to: string; p_bucket?: string };
        Returns: {
          bucket_start: string;
          new_users: number;
        }[];
      };
      // Somente service role (server function):
      capture_lead: {
        Args: {
          p_email: string;
          p_full_name?: string | null;
          p_phone?: string | null;
          p_anonymous_id?: string | null;
          p_session_id?: string | null;
          p_landing_slug?: string | null;
          p_utm?: Json;
          p_consents?: Json;
          p_properties?: Json;
        };
        Returns: {
          contact_id: number;
          is_new: boolean;
        }[];
      };
      track_event: {
        Args: {
          p_event_name: string;
          p_anonymous_id?: string | null;
          p_session_id?: string | null;
          p_contact_id?: number | null;
          p_user_id?: string | null;
          p_landing_slug?: string | null;
          p_utm?: Json;
          p_properties?: Json;
        };
        Returns: number;
      };
      // Helpers de autorização:
      current_contact_id: { Args: Record<PropertyKey, never>; Returns: number | null };
      has_active_consent: {
        Args: {
          p_contact_id: number;
          p_type: Database["public"]["Enums"]["consent_type"];
        };
        Returns: boolean;
      };
      has_any_role: {
        Args: { p_roles: Database["public"]["Enums"]["app_role"][] };
        Returns: boolean;
      };
      has_role: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] };
        Returns: boolean;
      };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "operator" | "marketing" | "finance" | "partner" | "client";
      consent_type: "terms" | "privacy" | "marketing" | "ai_memory" | "enneagram_profile_share";
      crm_stage:
        | "visitor"
        | "lead_captured"
        | "lead_qualified"
        | "signup_started"
        | "signup_completed"
        | "test_started"
        | "test_completed"
        | "result_viewed"
        | "subscription_started"
        | "active_customer"
        | "recurring_customer"
        | "churned"
        | "reactivated";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"];
export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T];

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "operator", "marketing", "finance", "partner", "client"],
      consent_type: ["terms", "privacy", "marketing", "ai_memory", "enneagram_profile_share"],
      crm_stage: [
        "visitor",
        "lead_captured",
        "lead_qualified",
        "signup_started",
        "signup_completed",
        "test_started",
        "test_completed",
        "result_viewed",
        "subscription_started",
        "active_customer",
        "recurring_customer",
        "churned",
        "reactivated",
      ],
    },
  },
} as const;
