export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      acquisition_channels: {
        Row: {
          code: string;
          created_at: string;
          id: number;
          is_active: boolean;
          is_paid: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
          utm_aliases: string[];
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          is_paid?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
          utm_aliases?: string[];
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          is_paid?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          utm_aliases?: string[];
        };
        Relationships: [];
      };
      ai_agent_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: number;
          knowledge_enabled: boolean;
          label: string | null;
          max_output_tokens: number;
          model: string;
          persona: string;
          published_at: string | null;
          published_by: string | null;
          status: string;
          type_guides: NonNullable<Json>;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: never;
          knowledge_enabled?: boolean;
          label?: string | null;
          max_output_tokens?: number;
          model: string;
          persona: string;
          published_at?: string | null;
          published_by?: string | null;
          status?: string;
          type_guides?: NonNullable<Json>;
          updated_at?: string;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: never;
          knowledge_enabled?: boolean;
          label?: string | null;
          max_output_tokens?: number;
          model?: string;
          persona?: string;
          published_at?: string | null;
          published_by?: string | null;
          status?: string;
          type_guides?: NonNullable<Json>;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          agent_version_id: number;
          channel: string;
          created_at: string;
          id: string;
          last_message_at: string;
          simulated_type: number | null;
          title: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          agent_version_id: number;
          channel: string;
          created_at?: string;
          id?: string;
          last_message_at?: string;
          simulated_type?: number | null;
          title?: string | null;
          user_id: string;
        };
        Update: {
          agent_version_id?: number;
          channel?: string;
          created_at?: string;
          id?: string;
          last_message_at?: string;
          simulated_type?: number | null;
          title?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_conversations_agent_version_id_fkey";
            columns: ["agent_version_id"];
            isOneToOne: false;
            referencedRelation: "ai_agent_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_messages: {
        Row: {
          conversation_id: string;
          created_at: string;
          id: string;
          parts: NonNullable<Json>;
          role: string;
          seq: number;
        };
        ComputedFields: never;
        Insert: {
          conversation_id: string;
          created_at?: string;
          id: string;
          parts: NonNullable<Json>;
          role: string;
          seq?: never;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          id?: string;
          parts?: NonNullable<Json>;
          role?: string;
          seq?: never;
        };
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_usage: {
        Row: {
          agent_version_id: number | null;
          at: string;
          cached_input_tokens: number;
          conversation_id: string | null;
          crisis_detected: boolean;
          error_code: string | null;
          feature: string;
          id: number;
          input_tokens: number;
          latency_ms: number | null;
          model: string;
          output_tokens: number;
          status: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          agent_version_id?: number | null;
          at?: string;
          cached_input_tokens?: number;
          conversation_id?: string | null;
          crisis_detected?: boolean;
          error_code?: string | null;
          feature: string;
          id?: never;
          input_tokens?: number;
          latency_ms?: number | null;
          model: string;
          output_tokens?: number;
          status: string;
          user_id?: string | null;
        };
        Update: {
          agent_version_id?: number | null;
          at?: string;
          cached_input_tokens?: number;
          conversation_id?: string | null;
          crisis_detected?: boolean;
          error_code?: string | null;
          feature?: string;
          id?: never;
          input_tokens?: number;
          latency_ms?: number | null;
          model?: string;
          output_tokens?: number;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_agent_version_id_fkey";
            columns: ["agent_version_id"];
            isOneToOne: false;
            referencedRelation: "ai_agent_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_results: {
        Row: {
          assessment_id: number;
          computed_at: string;
          id: number;
          primary_type: string;
          scores: NonNullable<Json>;
          scoring_version: string | null;
        };
        ComputedFields: never;
        Insert: {
          assessment_id: number;
          computed_at?: string;
          id?: never;
          primary_type: string;
          scores: NonNullable<Json>;
          scoring_version?: string | null;
        };
        Update: {
          assessment_id?: number;
          computed_at?: string;
          id?: never;
          primary_type?: string;
          scores?: NonNullable<Json>;
          scoring_version?: string | null;
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
          anonymous_id: string | null;
          answered_count: number;
          answers: Json | null;
          completed_at: string | null;
          contact_id: number | null;
          created_at: string;
          id: number;
          instrument: string;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          anonymous_id?: string | null;
          answered_count?: number;
          answers?: Json | null;
          completed_at?: string | null;
          contact_id?: number | null;
          created_at?: string;
          id?: never;
          instrument: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          anonymous_id?: string | null;
          answered_count?: number;
          answers?: Json | null;
          completed_at?: string | null;
          contact_id?: number | null;
          created_at?: string;
          id?: never;
          instrument?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
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
          action: string;
          actor_id: string | null;
          at: string;
          diff: Json | null;
          entity_id: string | null;
          entity_table: string;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_table: string;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_table?: string;
          id?: never;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          channel_id: number;
          created_at: string;
          ends_on: string | null;
          id: number;
          name: string;
          starts_on: string | null;
          status: string;
          updated_at: string;
          utm_campaign: string | null;
        };
        ComputedFields: never;
        Insert: {
          channel_id: number;
          created_at?: string;
          ends_on?: string | null;
          id?: never;
          name: string;
          starts_on?: string | null;
          status?: string;
          updated_at?: string;
          utm_campaign?: string | null;
        };
        Update: {
          channel_id?: number;
          created_at?: string;
          ends_on?: string | null;
          id?: never;
          name?: string;
          starts_on?: string | null;
          status?: string;
          updated_at?: string;
          utm_campaign?: string | null;
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
          consent_type: Database["public"]["Enums"]["consent_type"];
          contact_id: number;
          created_at: string;
          document_version: string;
          granted: boolean;
          id: number;
          source: string | null;
        };
        ComputedFields: never;
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"];
          contact_id: number;
          created_at?: string;
          document_version: string;
          granted: boolean;
          id?: never;
          source?: string | null;
        };
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"];
          contact_id?: number;
          created_at?: string;
          document_version?: string;
          granted?: boolean;
          id?: never;
          source?: string | null;
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
          created_at: string;
          created_by: string | null;
          tag_id: number;
        };
        ComputedFields: never;
        Insert: {
          contact_id: number;
          created_at?: string;
          created_by?: string | null;
          tag_id: number;
        };
        Update: {
          contact_id?: number;
          created_at?: string;
          created_by?: string | null;
          tag_id?: number;
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
          created_at: string;
          email: string | null;
          first_campaign_id: number | null;
          first_channel_id: number | null;
          first_landing_page_id: number | null;
          first_touch_at: string | null;
          first_utm_campaign: string | null;
          first_utm_content: string | null;
          first_utm_medium: string | null;
          first_utm_source: string | null;
          first_utm_term: string | null;
          full_name: string | null;
          id: number;
          last_campaign_id: number | null;
          last_channel_id: number | null;
          last_interaction_at: string | null;
          last_landing_page_id: number | null;
          last_touch_at: string | null;
          last_utm_campaign: string | null;
          last_utm_content: string | null;
          last_utm_medium: string | null;
          last_utm_source: string | null;
          last_utm_term: string | null;
          notes: string | null;
          phone: string | null;
          stage: Database["public"]["Enums"]["crm_stage"];
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          first_campaign_id?: number | null;
          first_channel_id?: number | null;
          first_landing_page_id?: number | null;
          first_touch_at?: string | null;
          first_utm_campaign?: string | null;
          first_utm_content?: string | null;
          first_utm_medium?: string | null;
          first_utm_source?: string | null;
          first_utm_term?: string | null;
          full_name?: string | null;
          id?: never;
          last_campaign_id?: number | null;
          last_channel_id?: number | null;
          last_interaction_at?: string | null;
          last_landing_page_id?: number | null;
          last_touch_at?: string | null;
          last_utm_campaign?: string | null;
          last_utm_content?: string | null;
          last_utm_medium?: string | null;
          last_utm_source?: string | null;
          last_utm_term?: string | null;
          notes?: string | null;
          phone?: string | null;
          stage?: Database["public"]["Enums"]["crm_stage"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          first_campaign_id?: number | null;
          first_channel_id?: number | null;
          first_landing_page_id?: number | null;
          first_touch_at?: string | null;
          first_utm_campaign?: string | null;
          first_utm_content?: string | null;
          first_utm_medium?: string | null;
          first_utm_source?: string | null;
          first_utm_term?: string | null;
          full_name?: string | null;
          id?: never;
          last_campaign_id?: number | null;
          last_channel_id?: number | null;
          last_interaction_at?: string | null;
          last_landing_page_id?: number | null;
          last_touch_at?: string | null;
          last_utm_campaign?: string | null;
          last_utm_content?: string | null;
          last_utm_medium?: string | null;
          last_utm_source?: string | null;
          last_utm_term?: string | null;
          notes?: string | null;
          phone?: string | null;
          stage?: Database["public"]["Enums"]["crm_stage"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_contacts_first_campaign_id_fkey";
            columns: ["first_campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_first_channel_id_fkey";
            columns: ["first_channel_id"];
            isOneToOne: false;
            referencedRelation: "acquisition_channels";
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
            foreignKeyName: "crm_contacts_last_campaign_id_fkey";
            columns: ["last_campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
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
          author_id: string | null;
          channel: string | null;
          contact_id: number;
          content: string;
          created_at: string;
          id: number;
          interaction_type: string;
          occurred_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          channel?: string | null;
          contact_id: number;
          content: string;
          created_at?: string;
          id?: never;
          interaction_type: string;
          occurred_at?: string;
        };
        Update: {
          author_id?: string | null;
          channel?: string | null;
          contact_id?: number;
          content?: string;
          created_at?: string;
          id?: never;
          interaction_type?: string;
          occurred_at?: string;
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
          changed_at: string;
          changed_by: string | null;
          contact_id: number;
          from_stage: Database["public"]["Enums"]["crm_stage"] | null;
          id: number;
          reason: string | null;
          to_stage: Database["public"]["Enums"]["crm_stage"];
        };
        ComputedFields: never;
        Insert: {
          changed_at?: string;
          changed_by?: string | null;
          contact_id: number;
          from_stage?: Database["public"]["Enums"]["crm_stage"] | null;
          id?: never;
          reason?: string | null;
          to_stage: Database["public"]["Enums"]["crm_stage"];
        };
        Update: {
          changed_at?: string;
          changed_by?: string | null;
          contact_id?: number;
          from_stage?: Database["public"]["Enums"]["crm_stage"] | null;
          id?: never;
          reason?: string | null;
          to_stage?: Database["public"]["Enums"]["crm_stage"];
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
          created_at: string;
          description: string | null;
          funnel_order: number | null;
          funnel_stage: Database["public"]["Enums"]["crm_stage"] | null;
          is_active: boolean;
          name: string;
          touches_contact: boolean;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          funnel_order?: number | null;
          funnel_stage?: Database["public"]["Enums"]["crm_stage"] | null;
          is_active?: boolean;
          name: string;
          touches_contact?: boolean;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          funnel_order?: number | null;
          funnel_stage?: Database["public"]["Enums"]["crm_stage"] | null;
          is_active?: boolean;
          name?: string;
          touches_contact?: boolean;
        };
        Relationships: [];
      };
      events: {
        Row: {
          anonymous_id: string | null;
          campaign_id: number | null;
          channel_id: number | null;
          contact_id: number | null;
          event_name: string;
          id: number;
          landing_page_id: number | null;
          occurred_at: string;
          properties: NonNullable<Json>;
          session_id: string | null;
          user_id: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
        };
        ComputedFields: never;
        Insert: {
          anonymous_id?: string | null;
          campaign_id?: number | null;
          channel_id?: number | null;
          contact_id?: number | null;
          event_name: string;
          id?: never;
          landing_page_id?: number | null;
          occurred_at?: string;
          properties?: NonNullable<Json>;
          session_id?: string | null;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
        };
        Update: {
          anonymous_id?: string | null;
          campaign_id?: number | null;
          channel_id?: number | null;
          contact_id?: number | null;
          event_name?: string;
          id?: never;
          landing_page_id?: number | null;
          occurred_at?: string;
          properties?: NonNullable<Json>;
          session_id?: string | null;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
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
            foreignKeyName: "events_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_event_name_fkey";
            columns: ["event_name"];
            isOneToOne: false;
            referencedRelation: "event_types";
            referencedColumns: ["name"];
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
          campaign_id: number | null;
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          path: string | null;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          campaign_id?: number | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name: string;
          path?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          campaign_id?: number | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name?: string;
          path?: string | null;
          slug?: string;
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
          amount: number;
          campaign_id: number | null;
          channel_id: number;
          created_at: string;
          created_by: string | null;
          currency: string;
          id: number;
          notes: string | null;
          spend_date: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          campaign_id?: number | null;
          channel_id: number;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: never;
          notes?: string | null;
          spend_date: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          campaign_id?: number | null;
          channel_id?: number;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: never;
          notes?: string | null;
          spend_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_spend_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketing_spend_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "acquisition_channels";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          billing_interval: string;
          code: string;
          created_at: string;
          currency: string;
          description: string | null;
          id: number;
          is_active: boolean;
          limits: NonNullable<Json>;
          name: string;
          price: number;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          billing_interval: string;
          code: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: never;
          is_active?: boolean;
          limits?: NonNullable<Json>;
          name: string;
          price: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          billing_interval?: string;
          code?: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: never;
          is_active?: boolean;
          limits?: NonNullable<Json>;
          name?: string;
          price?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      professionals: {
        Row: {
          bio: string | null;
          created_at: string;
          full_name: string;
          invite_accepted_at: string | null;
          invited_by: string | null;
          registry_council: string;
          registry_number: string;
          registry_state: string;
          specialties: string[];
          updated_at: string;
          user_id: string;
          verification_note: string | null;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          bio?: string | null;
          created_at?: string;
          full_name: string;
          invite_accepted_at?: string | null;
          invited_by?: string | null;
          registry_council: string;
          registry_number: string;
          registry_state: string;
          specialties?: string[];
          updated_at?: string;
          user_id: string;
          verification_note?: string | null;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          full_name?: string;
          invite_accepted_at?: string | null;
          invited_by?: string | null;
          registry_council?: string;
          registry_number?: string;
          registry_state?: string;
          specialties?: string[];
          updated_at?: string;
          user_id?: string;
          verification_note?: string | null;
          verification_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          locale: string;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          locale?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          locale?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string;
          id: number;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: never;
          name: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: never;
          name?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          granted_by: string | null;
          id: number;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          id?: never;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          id?: never;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_client_ai_summary: {
        Args: { p_user_id: string };
        Returns: {
          conversations: number;
          input_tokens: number;
          last_activity_at: string;
          messages: number;
          output_tokens: number;
        }[];
      };
      admin_client_detail: { Args: { p_user_id: string }; Returns: Json };
      admin_dashboard_metrics: {
        Args: { p_active_window_days?: number; p_currency?: string; p_from: string; p_to: string };
        Returns: Json;
      };
      admin_funnel: {
        Args: { p_from: string; p_to: string };
        Returns: {
          conversion_from_previous: number;
          step: string;
          step_order: number;
          total_events: number;
          unique_actors: number;
        }[];
      };
      admin_list_clients: {
        Args: { p_after?: number; p_limit?: number; p_search?: string };
        Returns: {
          assessment_completed_at: string;
          contact_id: number;
          created_at: string;
          email: string;
          full_name: string;
          phone: string;
          primary_type: string;
          stage: Database["public"]["Enums"]["crm_stage"];
          user_id: string;
        }[];
      };
      admin_new_users_series: {
        Args: { p_bucket?: string; p_from: string; p_to: string };
        Returns: {
          bucket_start: string;
          new_users: number;
        }[];
      };
      admin_register_professional: {
        Args: {
          p_bio?: string;
          p_full_name: string;
          p_registry_council: string;
          p_registry_number: string;
          p_registry_state: string;
          p_specialties?: string[];
          p_user_id: string;
        };
        Returns: {
          bio: string | null;
          created_at: string;
          full_name: string;
          invite_accepted_at: string | null;
          invited_by: string | null;
          registry_council: string;
          registry_number: string;
          registry_state: string;
          specialties: string[];
          updated_at: string;
          user_id: string;
          verification_note: string | null;
          verification_status: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "professionals";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      ai_publish_agent_version: {
        Args: { p_version_id: number };
        Returns: {
          created_at: string;
          created_by: string | null;
          id: number;
          knowledge_enabled: boolean;
          label: string | null;
          max_output_tokens: number;
          model: string;
          persona: string;
          published_at: string | null;
          published_by: string | null;
          status: string;
          type_guides: NonNullable<Json>;
          updated_at: string;
          version: number;
        };
        SetofOptions: {
          from: "*";
          to: "ai_agent_versions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      assert_json_object: {
        Args: { p_label: string; p_max_bytes: number; p_value: Json };
        Returns: undefined;
      };
      capture_lead: {
        Args: {
          p_anonymous_id?: string;
          p_consents?: Json;
          p_email: string;
          p_full_name?: string;
          p_landing_slug?: string;
          p_phone?: string;
          p_properties?: Json;
          p_session_id?: string;
          p_utm?: Json;
        };
        Returns: {
          contact_id: number;
          is_new: boolean;
        }[];
      };
      current_contact_id: { Args: Record<PropertyKey, never>; Returns: number };
      has_active_consent: {
        Args: { p_contact_id: number; p_type: Database["public"]["Enums"]["consent_type"] };
        Returns: boolean;
      };
      has_any_role: {
        Args: { p_roles: Database["public"]["Enums"]["app_role"][] };
        Returns: boolean;
      };
      has_role: { Args: { p_role: Database["public"]["Enums"]["app_role"] }; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      resolve_acquisition: {
        Args: { p_landing_slug: string; p_utm: Json };
        Returns: {
          o_campaign_id: number;
          o_channel_id: number;
          o_landing_page_id: number;
        }[];
      };
      sync_user_contact: {
        Args: { p_email: string; p_meta: Json; p_user_id: string };
        Returns: undefined;
      };
      track_event: {
        Args: {
          p_anonymous_id?: string;
          p_contact_id?: number;
          p_event_name: string;
          p_landing_slug?: string;
          p_properties?: Json;
          p_session_id?: string;
          p_user_id?: string;
          p_utm?: Json;
        };
        Returns: number;
      };
    };
    Enums: {
      app_role: "admin" | "collaborator" | "partner" | "client";
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "collaborator", "partner", "client"],
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
