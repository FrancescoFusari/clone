export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      category_insights: {
        Row: {
          category: Database["public"]["Enums"]["entry_category"]
          created_at: string | null
          error_message: string | null
          id: string
          insights: Json | null
          last_analyzed_at: string | null
          status: Database["public"]["Enums"]["category_analysis_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["entry_category"]
          created_at?: string | null
          error_message?: string | null
          id?: string
          insights?: Json | null
          last_analyzed_at?: string | null
          status?:
            | Database["public"]["Enums"]["category_analysis_status"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["entry_category"]
          created_at?: string | null
          error_message?: string | null
          id?: string
          insights?: Json | null
          last_analyzed_at?: string | null
          status?:
            | Database["public"]["Enums"]["category_analysis_status"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          model: Database["public"]["Enums"]["chat_model"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: Database["public"]["Enums"]["chat_model"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: Database["public"]["Enums"]["chat_model"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_preferences: {
        Row: {
          avatar_url: string | null
          created_at: string
          layout: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          layout?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          layout?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          analysis_data: Json | null
          analysis_generated_at: string | null
          attachments: Json | null
          category: Database["public"]["Enums"]["entry_category"]
          chat_messages: Json | null
          color: string | null
          content: string
          created_at: string
          custom_subcategory: string | null
          entry_comments: Json | null
          entry_type: string | null
          folder: string
          formatted_content: string | null
          has_attachments: boolean | null
          id: string
          is_chat: boolean | null
          position_x: number | null
          position_y: number | null
          priority: string | null
          related_entries: string[] | null
          research_data: Json | null
          subcategory: string | null
          summary: string | null
          tags: string[] | null
          title: string
          user_id: string
          was_content_truncated: boolean | null
        }
        Insert: {
          analysis_data?: Json | null
          analysis_generated_at?: string | null
          attachments?: Json | null
          category: Database["public"]["Enums"]["entry_category"]
          chat_messages?: Json | null
          color?: string | null
          content: string
          created_at?: string
          custom_subcategory?: string | null
          entry_comments?: Json | null
          entry_type?: string | null
          folder: string
          formatted_content?: string | null
          has_attachments?: boolean | null
          id?: string
          is_chat?: boolean | null
          position_x?: number | null
          position_y?: number | null
          priority?: string | null
          related_entries?: string[] | null
          research_data?: Json | null
          subcategory?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          user_id: string
          was_content_truncated?: boolean | null
        }
        Update: {
          analysis_data?: Json | null
          analysis_generated_at?: string | null
          attachments?: Json | null
          category?: Database["public"]["Enums"]["entry_category"]
          chat_messages?: Json | null
          color?: string | null
          content?: string
          created_at?: string
          custom_subcategory?: string | null
          entry_comments?: Json | null
          entry_type?: string | null
          folder?: string
          formatted_content?: string | null
          has_attachments?: boolean | null
          id?: string
          is_chat?: boolean | null
          position_x?: number | null
          position_y?: number | null
          priority?: string | null
          related_entries?: string[] | null
          research_data?: Json | null
          subcategory?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string
          was_content_truncated?: boolean | null
        }
        Relationships: []
      }
      graph_edges: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string | null
          source_id: string
          target_id: string
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          source_id: string
          target_id: string
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          source_id?: string
          target_id?: string
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_nodes: {
        Row: {
          color: string | null
          created_at: string | null
          data: Json | null
          id: string
          label: string
          node_type: Database["public"]["Enums"]["graph_node_type"]
          reference_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          label: string
          node_type: Database["public"]["Enums"]["graph_node_type"]
          reference_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          label?: string
          node_type?: Database["public"]["Enums"]["graph_node_type"]
          reference_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          graph_settings: Json | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          graph_settings?: Json | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          graph_settings?: Json | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      tag_analytics: {
        Row: {
          created_at: string | null
          id: string
          last_used: string | null
          tag: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used?: string | null
          tag: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used?: string | null
          tag?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      user_consent: {
        Row: {
          ai_processing_consent: boolean
          consent_date: string | null
          last_updated: string | null
          user_id: string
        }
        Insert: {
          ai_processing_consent?: boolean
          consent_date?: string | null
          last_updated?: string | null
          user_id: string
        }
        Update: {
          ai_processing_consent?: boolean
          consent_date?: string | null
          last_updated?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      populate_graph_data: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      category_analysis_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
      chat_model: "gpt-4o-mini" | "gpt-4o"
      entry_category: "personal" | "work" | "social" | "interests" | "school"
      graph_node_type: "category" | "subcategory" | "entry" | "tag"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
