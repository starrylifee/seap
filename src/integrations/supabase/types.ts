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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      evaluation_areas: {
        Row: {
          code: string
          created_at: string
          description: string | null
          domain_id: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          domain_id: string
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          domain_id?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_areas_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "evaluation_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_domains: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      indicators: {
        Row: {
          area_id: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          area_id: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          area_id?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicators_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "evaluation_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          school_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          school_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          school_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          indicator_id: string | null
          is_required: boolean
          options: Json | null
          order_index: number
          project_id: string
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          respondent_type: Database["public"]["Enums"]["respondent_type"]
          section_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          indicator_id?: string | null
          is_required?: boolean
          options?: Json | null
          order_index?: number
          project_id: string
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          respondent_type: Database["public"]["Enums"]["respondent_type"]
          section_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          indicator_id?: string | null
          is_required?: boolean
          options?: Json | null
          order_index?: number
          project_id?: string
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          respondent_type?: Database["public"]["Enums"]["respondent_type"]
          section_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          created_at: string
          id: string
          project_id: string
          question_id: string
          respondent_type: Database["public"]["Enums"]["respondent_type"]
          response_data: Json | null
          response_value: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          question_id: string
          respondent_type: Database["public"]["Enums"]["respondent_type"]
          response_data?: Json | null
          response_value?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          question_id?: string
          respondent_type?: Database["public"]["Enums"]["respondent_type"]
          response_data?: Json | null
          response_value?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          region: string | null
          school_code: string
          school_name: string
          school_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          region?: string | null
          school_code: string
          school_name: string
          school_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          region?: string | null
          school_code?: string
          school_name?: string
          school_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      survey_links: {
        Row: {
          access_code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          project_id: string
          respondent_type: Database["public"]["Enums"]["respondent_type"]
        }
        Insert: {
          access_code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          project_id: string
          respondent_type: Database["public"]["Enums"]["respondent_type"]
        }
        Update: {
          access_code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          project_id?: string
          respondent_type?: Database["public"]["Enums"]["respondent_type"]
        }
        Relationships: [
          {
            foreignKeyName: "survey_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role_type"]
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      schools_public: {
        Row: {
          created_at: string | null
          id: string | null
          region: string | null
          school_code: string | null
          school_name: string | null
          school_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          region?: string | null
          school_code?: string | null
          school_name?: string | null
          school_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          region?: string | null
          school_code?: string | null
          school_name?: string | null
          school_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      project_status: "draft" | "active" | "closed" | "archived"
      question_type: "rating" | "multiple_choice" | "text" | "priority"
      respondent_type: "teacher" | "staff" | "parent" | "student"
      user_role_type: "admin" | "manager" | "viewer"
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
      project_status: ["draft", "active", "closed", "archived"],
      question_type: ["rating", "multiple_choice", "text", "priority"],
      respondent_type: ["teacher", "staff", "parent", "student"],
      user_role_type: ["admin", "manager", "viewer"],
    },
  },
} as const
