export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      project_sync_v1: {
        Row: {
          created_at: string;
          id: string;
          project_id: string;
          sipe_json: Json;
          sync_timestamp: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          project_id: string;
          sipe_json: Json;
          sync_timestamp?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          project_id?: string;
          sipe_json?: Json;
          sync_timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_sync_v1_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          description: string | null;
          health_score: number;
          id: string;
          last_sync: string | null;
          name: string;
          path: string;
          progress: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          health_score?: number;
          id?: string;
          last_sync?: string | null;
          name: string;
          path: string;
          progress?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          health_score?: number;
          id?: string;
          last_sync?: string | null;
          name?: string;
          path?: string;
          progress?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompt_metadata: {
        Row: {
          ai_summary: string | null;
          classification_suggestions: string[] | null;
          created_at: string;
          frontmatter: Json | null;
          id: string;
          prompt_id: string;
        };
        Insert: {
          ai_summary?: string | null;
          classification_suggestions?: string[] | null;
          created_at?: string;
          frontmatter?: Json | null;
          id?: string;
          prompt_id: string;
        };
        Update: {
          ai_summary?: string | null;
          classification_suggestions?: string[] | null;
          created_at?: string;
          frontmatter?: Json | null;
          id?: string;
          prompt_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_metadata_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: true;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          },
        ];
      };
      prompt_repos: {
        Row: {
          created_at: string;
          description: string | null;
          domain: string;
          id: string;
          name: string;
          owner_id: string | null;
          path: unknown;
          scenario: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          domain: string;
          id?: string;
          name: string;
          owner_id?: string | null;
          path: unknown;
          scenario: string;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          domain?: string;
          id?: string;
          name?: string;
          owner_id?: string | null;
          path?: unknown;
          scenario?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          config_yaml_path: string | null;
          content: string;
          context_md_path: string | null;
          created_at: string;
          id: string;
          main_prompt_path: string;
          repo_id: string;
          summary: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string;
          version: string;
        };
        Insert: {
          config_yaml_path?: string | null;
          content: string;
          context_md_path?: string | null;
          created_at?: string;
          id?: string;
          main_prompt_path: string;
          repo_id: string;
          summary?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string;
          version?: string;
        };
        Update: {
          config_yaml_path?: string | null;
          content?: string;
          context_md_path?: string | null;
          created_at?: string;
          id?: string;
          main_prompt_path?: string;
          repo_id?: string;
          summary?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompts_repo_id_fkey";
            columns: ["repo_id"];
            isOneToOne: false;
            referencedRelation: "prompt_repos";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          created_at: string;
          file_path: string;
          id: string;
          line_number: number | null;
          priority: string;
          project_id: string;
          status: string;
          task_text: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          file_path: string;
          id?: string;
          line_number?: number | null;
          priority?: string;
          project_id: string;
          status?: string;
          task_text: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          file_path?: string;
          id?: string;
          line_number?: number | null;
          priority?: string;
          project_id?: string;
          status?: string;
          task_text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      text2ltree: { Args: { "": string }; Returns: unknown };
    };
    Enums: {
      [_ in never]: never;
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
