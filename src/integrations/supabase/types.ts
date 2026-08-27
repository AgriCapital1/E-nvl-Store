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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      developer_apps: {
        Row: {
          category: string | null
          created_at: string
          developer_id: string
          downloads: number
          id: string
          name: string
          price_fcfa: number
          pricing_type: string
          short_description: string | null
          slug: string
          status: string
          storage_bytes: number
          updated_at: string
          version: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          developer_id: string
          downloads?: number
          id?: string
          name: string
          price_fcfa?: number
          pricing_type?: string
          short_description?: string | null
          slug: string
          status?: string
          storage_bytes?: number
          updated_at?: string
          version?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          developer_id?: string
          downloads?: number
          id?: string
          name?: string
          price_fcfa?: number
          pricing_type?: string
          short_description?: string | null
          slug?: string
          status?: string
          storage_bytes?: number
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_apps_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_profiles: {
        Row: {
          country: string | null
          created_at: string
          display_name: string
          id: string
          organization_name: string | null
          phone: string | null
          plan_code: string
          status: string
          storage_used_bytes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          organization_name?: string | null
          phone?: string | null
          plan_code?: string
          status?: string
          storage_used_bytes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          organization_name?: string | null
          phone?: string | null
          plan_code?: string
          status?: string
          storage_used_bytes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_profiles_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      payout_methods: {
        Row: {
          code: string
          created_at: string
          fee_fixed_fcfa: number
          fee_percent: number
          id: string
          is_active: boolean
          is_live: boolean
          kind: string
          min_amount_fcfa: number
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          fee_fixed_fcfa?: number
          fee_percent?: number
          id?: string
          is_active?: boolean
          is_live?: boolean
          kind?: string
          min_amount_fcfa?: number
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          fee_fixed_fcfa?: number
          fee_percent?: number
          id?: string
          is_active?: boolean
          is_live?: boolean
          kind?: string
          min_amount_fcfa?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          app_limit: number
          code: string
          commission_rate: number
          created_at: string
          currency: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price_fcfa: number
          pwa_build_limit_monthly: number
          sort_order: number
          storage_limit_bytes: number
          updated_at: string
        }
        Insert: {
          app_limit: number
          code: string
          commission_rate: number
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_fcfa?: number
          pwa_build_limit_monthly?: number
          sort_order?: number
          storage_limit_bytes: number
          updated_at?: string
        }
        Update: {
          app_limit?: number
          code?: string
          commission_rate?: number
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_fcfa?: number
          pwa_build_limit_monthly?: number
          sort_order?: number
          storage_limit_bytes?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_fcfa: number
          auto_renew: boolean
          created_at: string
          current_period_end: string | null
          developer_id: string
          external_reference: string | null
          id: string
          plan_code: string
          provider: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_fcfa?: number
          auto_renew?: boolean
          created_at?: string
          current_period_end?: string | null
          developer_id: string
          external_reference?: string | null
          id?: string
          plan_code: string
          provider?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_fcfa?: number
          auto_renew?: boolean
          created_at?: string
          current_period_end?: string | null
          developer_id?: string
          external_reference?: string | null
          id?: string
          plan_code?: string
          provider?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      transactions: {
        Row: {
          app_id: string | null
          commission_amount_fcfa: number
          commission_rate: number
          created_at: string
          currency: string
          developer_id: string
          envle_fee_fcfa: number
          gross_amount_fcfa: number
          id: string
          net_amount_fcfa: number
          occurred_at: string
          plan_snapshot: string
          provider_fee_fcfa: number
          reference: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          app_id?: string | null
          commission_amount_fcfa?: number
          commission_rate: number
          created_at?: string
          currency?: string
          developer_id: string
          envle_fee_fcfa?: number
          gross_amount_fcfa?: number
          id?: string
          net_amount_fcfa?: number
          occurred_at?: string
          plan_snapshot: string
          provider_fee_fcfa?: number
          reference?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          app_id?: string | null
          commission_amount_fcfa?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          developer_id?: string
          envle_fee_fcfa?: number
          gross_amount_fcfa?: number
          id?: string
          net_amount_fcfa?: number
          occurred_at?: string
          plan_snapshot?: string
          provider_fee_fcfa?: number
          reference?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      wallet_ledger: {
        Row: {
          amount_fcfa: number
          bucket: string
          created_at: string
          description: string | null
          developer_id: string
          entry_type: string
          id: string
          transaction_id: string | null
          withdrawal_id: string | null
        }
        Insert: {
          amount_fcfa: number
          bucket: string
          created_at?: string
          description?: string | null
          developer_id: string
          entry_type: string
          id?: string
          transaction_id?: string | null
          withdrawal_id?: string | null
        }
        Update: {
          amount_fcfa?: number
          bucket?: string
          created_at?: string
          description?: string | null
          developer_id?: string
          entry_type?: string
          id?: string
          transaction_id?: string | null
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_ledger_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount_fcfa: number
          created_at: string
          destination: string
          developer_id: string
          external_reference: string | null
          failure_reason: string | null
          fee_fcfa: number
          id: string
          net_amount_fcfa: number
          payout_method_code: string
          processed_at: string | null
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_fcfa: number
          created_at?: string
          destination: string
          developer_id: string
          external_reference?: string | null
          failure_reason?: string | null
          fee_fcfa?: number
          id?: string
          net_amount_fcfa?: number
          payout_method_code: string
          processed_at?: string | null
          reference?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_fcfa?: number
          created_at?: string
          destination?: string
          developer_id?: string
          external_reference?: string | null
          failure_reason?: string | null
          fee_fcfa?: number
          id?: string
          net_amount_fcfa?: number
          payout_method_code?: string
          processed_at?: string | null
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_payout_method_code_fkey"
            columns: ["payout_method_code"]
            isOneToOne: false
            referencedRelation: "payout_methods"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      developer_balances: {
        Args: { _developer_id: string }
        Returns: {
          available: number
          pending: number
          withdrawing: number
          withdrawn: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "developer"
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
      app_role: ["admin", "developer"],
    },
  },
} as const
