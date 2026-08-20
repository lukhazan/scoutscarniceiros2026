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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      art_templates: {
        Row: {
          category: string
          created_at: string
          default_background_url: string | null
          fields: Json
          id: string
          name: string
          preview_url: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_background_url?: string | null
          fields?: Json
          id?: string
          name: string
          preview_url?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_background_url?: string | null
          fields?: Json
          id?: string
          name?: string
          preview_url?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_identity: {
        Row: {
          accent_color: string
          created_at: string
          crest_black_url: string | null
          crest_url: string | null
          crest_white_url: string | null
          font_primary: string
          font_secondary: string
          footer_logo_url: string | null
          id: string
          primary_color: string
          secondary_color: string
          sponsors: Json
          team_name: string
          updated_at: string
          watermark_url: string | null
        }
        Insert: {
          accent_color?: string
          created_at?: string
          crest_black_url?: string | null
          crest_url?: string | null
          crest_white_url?: string | null
          font_primary?: string
          font_secondary?: string
          footer_logo_url?: string | null
          id?: string
          primary_color?: string
          secondary_color?: string
          sponsors?: Json
          team_name?: string
          updated_at?: string
          watermark_url?: string | null
        }
        Update: {
          accent_color?: string
          created_at?: string
          crest_black_url?: string | null
          crest_url?: string | null
          crest_white_url?: string | null
          font_primary?: string
          font_secondary?: string
          footer_logo_url?: string | null
          id?: string
          primary_color?: string
          secondary_color?: string
          sponsors?: Json
          team_name?: string
          updated_at?: string
          watermark_url?: string | null
        }
        Relationships: []
      }
      match_requests: {
        Row: {
          contact_name: string
          created_at: string
          end_time: string
          id: string
          location: string | null
          notes: string | null
          request_date: string
          start_time: string
          status: string
          team_name: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          end_time: string
          id?: string
          location?: string | null
          notes?: string | null
          request_date: string
          start_time: string
          status?: string
          team_name: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          end_time?: string
          id?: string
          location?: string | null
          notes?: string | null
          request_date?: string
          start_time?: string
          status?: string
          team_name?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      match_stats: {
        Row: {
          assists: number
          created_at: string
          goals: number
          goals_conceded: number
          id: string
          match_id: string
          played: boolean
          player_id: string
        }
        Insert: {
          assists?: number
          created_at?: string
          goals?: number
          goals_conceded?: number
          id?: string
          match_id: string
          played?: boolean
          player_id: string
        }
        Update: {
          assists?: number
          created_at?: string
          goals?: number
          goals_conceded?: number
          id?: string
          match_id?: string
          played?: boolean
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_totals"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          match_date: string
          notes: string | null
          opponent: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_date?: string
          notes?: string | null
          opponent?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_date?: string
          notes?: string | null
          opponent?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          storage_path: string | null
          updated_at: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          storage_path?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          storage_path?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      player_debts: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          player_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          player_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          player_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_debts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_totals"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_debts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_fees: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          due_day: number
          id: string
          notes: string | null
          player_id: string
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          created_at?: string
          due_day?: number
          id?: string
          notes?: string | null
          player_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          due_day?: number
          id?: string
          notes?: string | null
          player_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_fees_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "player_totals"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_fees_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_stats: {
        Row: {
          assists: number
          created_at: string
          goals: number
          goals_conceded: number
          id: string
          player_id: string
          season: number
          updated_at: string
        }
        Insert: {
          assists?: number
          created_at?: string
          goals?: number
          goals_conceded?: number
          id?: string
          player_id: string
          season: number
          updated_at?: string
        }
        Update: {
          assists?: number
          created_at?: string
          goals?: number
          goals_conceded?: number
          id?: string
          player_id?: string
          season?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_season_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_totals"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "player_season_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          active: boolean
          created_at: string
          id: string
          initial_assists: number
          initial_conceded: number
          initial_goals: number
          name: string
          nickname: string | null
          photo_original_url: string | null
          photo_url: string | null
          position: string | null
          shirt_number: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          initial_assists?: number
          initial_conceded?: number
          initial_goals?: number
          name: string
          nickname?: string | null
          photo_original_url?: string | null
          photo_url?: string | null
          position?: string | null
          shirt_number?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          initial_assists?: number
          initial_conceded?: number
          initial_goals?: number
          name?: string
          nickname?: string | null
          photo_original_url?: string | null
          photo_url?: string | null
          position?: string | null
          shirt_number?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_slots: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          location: string | null
          start_time: string
          updated_at: string
          weekday: number
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          updated_at?: string
          weekday: number
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          updated_at?: string
          weekday?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      saved_art_templates: {
        Row: {
          art_data: Json
          base_slug: string
          created_at: string
          editable_fields: string[]
          id: string
          name: string
          preview_url: string | null
          updated_at: string
        }
        Insert: {
          art_data?: Json
          base_slug: string
          created_at?: string
          editable_fields?: string[]
          id?: string
          name: string
          preview_url?: string | null
          updated_at?: string
        }
        Update: {
          art_data?: Json
          base_slug?: string
          created_at?: string
          editable_fields?: string[]
          id?: string
          name?: string
          preview_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_events: {
        Row: {
          created_at: string
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          notes: string | null
          opponent: string | null
          public_visible: boolean
          start_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          event_date: string
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          opponent?: string | null
          public_visible?: boolean
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          opponent?: string | null
          public_visible?: boolean
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
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
      player_totals: {
        Row: {
          active: boolean | null
          assists: number | null
          contributions: number | null
          goals: number | null
          goals_conceded: number | null
          initial_goals: number | null
          matches_played: number | null
          name: string | null
          nickname: string | null
          photo_url: string | null
          player_id: string | null
          position: string | null
          shirt_number: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      busy_periods: {
        Args: { from_date: string; to_date: string }
        Returns: {
          end_time: string
          event_date: string
          start_time: string
        }[]
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
