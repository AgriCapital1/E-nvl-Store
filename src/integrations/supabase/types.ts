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
  public: {
    Tables: {
      app_versions: {
        Row: {
          apk_path: string | null
          apk_size_bytes: number
          checksum_sha256: string | null
          crash_rate: number
          created_at: string
          developer_app_id: string
          id: string
          min_android: string | null
          permissions: Json
          pwa_build_id: string | null
          rejection_reason: string | null
          release_notes_en: string | null
          release_notes_fr: string | null
          scan_report: Json | null
          scan_status: string
          status: string
          updated_at: string
          version: string
          version_code: number
        }
        Insert: {
          apk_path?: string | null
          apk_size_bytes?: number
          checksum_sha256?: string | null
          crash_rate?: number
          created_at?: string
          developer_app_id: string
          id?: string
          min_android?: string | null
          permissions?: Json
          pwa_build_id?: string | null
          rejection_reason?: string | null
          release_notes_en?: string | null
          release_notes_fr?: string | null
          scan_report?: Json | null
          scan_status?: string
          status?: string
          updated_at?: string
          version: string
          version_code?: number
        }
        Update: {
          apk_path?: string | null
          apk_size_bytes?: number
          checksum_sha256?: string | null
          crash_rate?: number
          created_at?: string
          developer_app_id?: string
          id?: string
          min_android?: string | null
          permissions?: Json
          pwa_build_id?: string | null
          rejection_reason?: string | null
          release_notes_en?: string | null
          release_notes_fr?: string | null
          scan_report?: Json | null
          scan_status?: string
          status?: string
          updated_at?: string
          version?: string
          version_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_versions_developer_app_id_fkey"
            columns: ["developer_app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_versions_pwa_build_id_fkey"
            columns: ["pwa_build_id"]
            isOneToOne: false
            referencedRelation: "pwa_builds"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name_en: string
          name_fr: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_en: string
          name_fr: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_en?: string
          name_fr?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      developer_apps: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          developer_id: string
          downloads: number
          icon_path: string | null
          id: string
          name: string
          price_fcfa: number
          pricing_type: string
          pwa_url: string | null
          rejection_reason: string | null
          screenshots: Json
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
          description?: string | null
          developer_id: string
          downloads?: number
          icon_path?: string | null
          id?: string
          name: string
          price_fcfa?: number
          pricing_type?: string
          pwa_url?: string | null
          rejection_reason?: string | null
          screenshots?: Json
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
          description?: string | null
          developer_id?: string
          downloads?: number
          icon_path?: string | null
          id?: string
          name?: string
          price_fcfa?: number
          pricing_type?: string
          pwa_url?: string | null
          rejection_reason?: string | null
          screenshots?: Json
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
      favorites: {
        Row: {
          created_at: string
          id: string
          store_app_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_app_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_app_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_store_app_id_fkey"
            columns: ["store_app_id"]
            isOneToOne: false
            referencedRelation: "store_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      installs: {
        Row: {
          created_at: string
          device_model: string | null
          id: string
          status: string
          store_app_id: string
          user_id: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          device_model?: string | null
          id?: string
          status?: string
          store_app_id: string
          user_id?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          device_model?: string | null
          id?: string
          status?: string
          store_app_id?: string
          user_id?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installs_store_app_id_fkey"
            columns: ["store_app_id"]
            isOneToOne: false
            referencedRelation: "store_apps"
            referencedColumns: ["id"]
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
      pwa_builds: {
        Row: {
          app_name: string
          artifact_path: string | null
          artifact_size_bytes: number | null
          created_at: string
          developer_app_id: string | null
          developer_id: string
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          icon_path: string | null
          id: string
          options: Json
          package_name: string
          progress: number
          queue_position: number | null
          reference: string
          source_url: string
          started_at: string | null
          status: string
          theme_color: string | null
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          app_name: string
          artifact_path?: string | null
          artifact_size_bytes?: number | null
          created_at?: string
          developer_app_id?: string | null
          developer_id: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          icon_path?: string | null
          id?: string
          options?: Json
          package_name: string
          progress?: number
          queue_position?: number | null
          reference?: string
          source_url: string
          started_at?: string | null
          status?: string
          theme_color?: string | null
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          app_name?: string
          artifact_path?: string | null
          artifact_size_bytes?: number | null
          created_at?: string
          developer_app_id?: string | null
          developer_id?: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          icon_path?: string | null
          id?: string
          options?: Json
          package_name?: string
          progress?: number
          queue_position?: number | null
          reference?: string
          source_url?: string
          started_at?: string | null
          status?: string
          theme_color?: string | null
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pwa_builds_developer_app_id_fkey"
            columns: ["developer_app_id"]
            isOneToOne: false
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pwa_builds_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          comment: string | null
          created_at: string
          developer_replied_at: string | null
          developer_reply: string | null
          helpful_count: number
          id: string
          language: string
          rating: number
          status: string
          store_app_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string
          comment?: string | null
          created_at?: string
          developer_replied_at?: string | null
          developer_reply?: string | null
          helpful_count?: number
          id?: string
          language?: string
          rating: number
          status?: string
          store_app_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          comment?: string | null
          created_at?: string
          developer_replied_at?: string | null
          developer_reply?: string | null
          helpful_count?: number
          id?: string
          language?: string
          rating?: number
          status?: string
          store_app_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_store_app_id_fkey"
            columns: ["store_app_id"]
            isOneToOne: false
            referencedRelation: "store_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      store_apps: {
        Row: {
          apk_size_bytes: number
          category_slug: string | null
          current_version: string
          description: string | null
          developer_app_id: string
          developer_id: string
          downloads: number
          downloads_24h: number
          icon_path: string | null
          id: string
          is_featured: boolean
          min_android: string | null
          name: string
          permissions: Json
          price_fcfa: number
          pricing_type: string
          published_at: string
          publisher_name: string
          rating_average: number
          rating_count: number
          screenshots: Json
          security_scan: string
          short_description: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          apk_size_bytes?: number
          category_slug?: string | null
          current_version?: string
          description?: string | null
          developer_app_id: string
          developer_id: string
          downloads?: number
          downloads_24h?: number
          icon_path?: string | null
          id?: string
          is_featured?: boolean
          min_android?: string | null
          name: string
          permissions?: Json
          price_fcfa?: number
          pricing_type?: string
          published_at?: string
          publisher_name: string
          rating_average?: number
          rating_count?: number
          screenshots?: Json
          security_scan?: string
          short_description?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          apk_size_bytes?: number
          category_slug?: string | null
          current_version?: string
          description?: string | null
          developer_app_id?: string
          developer_id?: string
          downloads?: number
          downloads_24h?: number
          icon_path?: string | null
          id?: string
          is_featured?: boolean
          min_android?: string | null
          name?: string
          permissions?: Json
          price_fcfa?: number
          pricing_type?: string
          published_at?: string
          publisher_name?: string
          rating_average?: number
          rating_count?: number
          screenshots?: Json
          security_scan?: string
          short_description?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_apps_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "store_apps_developer_app_id_fkey"
            columns: ["developer_app_id"]
            isOneToOne: true
            referencedRelation: "developer_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_apps_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_profiles: {
        Row: {
          avatar_path: string | null
          country: string | null
          created_at: string
          display_name: string
          id: string
          locale: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
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
      withdrawal_notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          delivery_error: string | null
          delivery_status: string
          destination: string | null
          developer_id: string
          id: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
          withdrawal_id: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          delivery_error?: string | null
          delivery_status?: string
          destination?: string | null
          developer_id: string
          id?: string
          sent_at?: string | null
          status: string
          subject: string
          updated_at?: string
          withdrawal_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          delivery_error?: string | null
          delivery_status?: string
          destination?: string | null
          developer_id?: string
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_notifications_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_notifications_withdrawal_id_fkey"
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
      admin_review_version: {
        Args: { _approve: boolean; _reason?: string; _version_id: string }
        Returns: Json
      }
      become_developer: {
        Args: { _country?: string; _display_name: string }
        Returns: string
      }
      cancel_withdrawal: { Args: { _withdrawal_id: string }; Returns: Json }
      change_plan: { Args: { _plan_code: string }; Returns: Json }
      complete_withdrawal: {
        Args: { _external_reference: string; _withdrawal_id: string }
        Returns: undefined
      }
      current_developer_id: { Args: never; Returns: string }
      developer_balances: {
        Args: { _developer_id: string }
        Returns: {
          available: number
          pending: number
          withdrawing: number
          withdrawn: number
        }[]
      }
      developer_usage: {
        Args: { _developer_id: string }
        Returns: {
          app_count: number
          app_limit: number
          build_limit: number
          builds_this_month: number
          commission_rate: number
          plan_code: string
          storage_limit: number
          storage_used: number
        }[]
      }
      fail_withdrawal: {
        Args: { _reason: string; _withdrawal_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_install: {
        Args: {
          _device_model?: string
          _store_app_id: string
          _version?: string
        }
        Returns: Json
      }
      record_sale: {
        Args: {
          _developer_app_id: string
          _external_reference?: string
          _gross_amount: number
          _provider_fee: number
        }
        Returns: string
      }
      refund_transaction: {
        Args: { _transaction_id: string }
        Returns: undefined
      }
      request_pwa_build: {
        Args: {
          _app_name: string
          _developer_app_id?: string
          _options?: Json
          _package_name: string
          _source_url: string
          _theme_color?: string
        }
        Returns: Json
      }
      request_withdrawal: {
        Args: {
          _amount: number
          _destination: string
          _payout_method_code: string
        }
        Returns: Json
      }
      settle_transaction: {
        Args: { _transaction_id: string }
        Returns: undefined
      }
      submit_app_version: {
        Args: {
          _apk_path: string
          _apk_size_bytes: number
          _checksum?: string
          _developer_app_id: string
          _min_android?: string
          _permissions?: Json
          _pwa_build_id?: string
          _release_notes_fr?: string
          _version: string
          _version_code: number
        }
        Returns: Json
      }
      update_pwa_build_status: {
        Args: {
          _artifact_path?: string
          _artifact_size_bytes?: number
          _build_id: string
          _error_code?: string
          _error_message?: string
          _progress?: number
          _status: string
        }
        Returns: undefined
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
