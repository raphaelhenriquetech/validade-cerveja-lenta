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
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: []
      }
      beer_batches: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          beer_name: string
          created_at: string | null
          expiration_date: string
          id: string
          lot: string
          olist_synced: boolean | null
          olist_synced_at: string | null
          quantity: number
          sku: string | null
          tiny_description_updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          beer_name: string
          created_at?: string | null
          expiration_date: string
          id?: string
          lot: string
          olist_synced?: boolean | null
          olist_synced_at?: string | null
          quantity: number
          sku?: string | null
          tiny_description_updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          beer_name?: string
          created_at?: string | null
          expiration_date?: string
          id?: string
          lot?: string
          olist_synced?: boolean | null
          olist_synced_at?: string | null
          quantity?: number
          sku?: string | null
          tiny_description_updated_at?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      j3_orders: {
        Row: {
          api_response: Json | null
          bairro_entrega: string
          cep_entrega: string
          cidade_entrega: string
          cod_servico: string | null
          codpedido: number | null
          cpf_cnpj_comprador: string | null
          created_at: string | null
          endereco_entrega: string
          estado_entrega: string
          id: string
          id_envio: string
          id_venda: string
          nome_comprador: string
          peso: number | null
          status: string | null
          telefone_comprador: string
          valor_pago: number | null
        }
        Insert: {
          api_response?: Json | null
          bairro_entrega: string
          cep_entrega: string
          cidade_entrega: string
          cod_servico?: string | null
          codpedido?: number | null
          cpf_cnpj_comprador?: string | null
          created_at?: string | null
          endereco_entrega: string
          estado_entrega: string
          id?: string
          id_envio: string
          id_venda: string
          nome_comprador: string
          peso?: number | null
          status?: string | null
          telefone_comprador: string
          valor_pago?: number | null
        }
        Update: {
          api_response?: Json | null
          bairro_entrega?: string
          cep_entrega?: string
          cidade_entrega?: string
          cod_servico?: string | null
          codpedido?: number | null
          cpf_cnpj_comprador?: string | null
          created_at?: string | null
          endereco_entrega?: string
          estado_entrega?: string
          id?: string
          id_envio?: string
          id_venda?: string
          nome_comprador?: string
          peso?: number | null
          status?: string | null
          telefone_comprador?: string
          valor_pago?: number | null
        }
        Relationships: []
      }
      j3_seller_config: {
        Row: {
          ambiente: string | null
          bairro_retirada: string
          cep_vendedor: string
          cidade_retirada: string
          cliente: string
          cnpj_transportadora: string
          cnpj_vendedor: string
          cod_cliente: string
          complemento_retirada: string | null
          created_at: string | null
          email_vendedor: string | null
          estado_retirada: string
          id: string
          ie_vendedor: string | null
          local_retirada: string
          numero_retirada: string | null
          razao_social: string
          telefone_vendedor: string | null
          updated_at: string | null
        }
        Insert: {
          ambiente?: string | null
          bairro_retirada: string
          cep_vendedor: string
          cidade_retirada: string
          cliente: string
          cnpj_transportadora: string
          cnpj_vendedor: string
          cod_cliente: string
          complemento_retirada?: string | null
          created_at?: string | null
          email_vendedor?: string | null
          estado_retirada: string
          id?: string
          ie_vendedor?: string | null
          local_retirada: string
          numero_retirada?: string | null
          razao_social: string
          telefone_vendedor?: string | null
          updated_at?: string | null
        }
        Update: {
          ambiente?: string | null
          bairro_retirada?: string
          cep_vendedor?: string
          cidade_retirada?: string
          cliente?: string
          cnpj_transportadora?: string
          cnpj_vendedor?: string
          cod_cliente?: string
          complemento_retirada?: string | null
          created_at?: string | null
          email_vendedor?: string | null
          estado_retirada?: string
          id?: string
          ie_vendedor?: string | null
          local_retirada?: string
          numero_retirada?: string | null
          razao_social?: string
          telefone_vendedor?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tiny_product_cache: {
        Row: {
          created_at: string
          fetched_at: string
          image_url: string | null
          not_found: boolean
          product_name: string | null
          sku: string
          tiny_product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fetched_at?: string
          image_url?: string | null
          not_found?: boolean
          product_name?: string | null
          sku: string
          tiny_product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fetched_at?: string
          image_url?: string | null
          not_found?: boolean
          product_name?: string | null
          sku?: string
          tiny_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          apikey: string
          created_at: string | null
          id: string
          is_active: boolean | null
          phone_number: string
        }
        Insert: {
          apikey: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number: string
        }
        Update: {
          apikey?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
