export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          name: string
          type: string
          address: string
          city: string
          state: string
          zip: string
          units: number
          size: number | null
          description: string | null
          amenities: {
            parking: boolean
            security: boolean
            elevator: boolean
            pool: boolean
            gym: boolean
            airConditioning: boolean
          }
          image_urls: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          address: string
          city: string
          state: string
          zip: string
          units: number
          size?: number | null
          description?: string | null
          amenities?: {
            parking: boolean
            security: boolean
            elevator: boolean
            pool: boolean
            gym: boolean
            airConditioning: boolean
          }
          image_urls?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      units: {
        Row: {
          id: string
          property_id: string
          name: string
          floor: number | null
          size: number | null
          rent_amount: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          name: string
          floor?: number | null
          size?: number | null
          rent_amount?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['units']['Insert']>
      }
      tenants: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          property_id: string | null
          unit_id: string | null
          move_in_date: string | null
          lease_end_date: string | null
          rent: number | null
          deposit: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          property_id?: string | null
          unit_id?: string | null
          move_in_date?: string | null
          lease_end_date?: string | null
          rent?: number | null
          deposit?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      contracts: {
        Row: {
          id: string
          contract_id: string
          tenant_id: string
          property_id: string
          unit_id: string
          start_date: string
          end_date: string
          rent_amount: number
          deposit_amount: number | null
          payment_frequency: string
          terms: string | null
          file_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          tenant_id: string
          property_id: string
          unit_id: string
          start_date: string
          end_date: string
          rent_amount: number
          deposit_amount?: number | null
          payment_frequency?: string
          terms?: string | null
          file_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['contracts']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          tenant_id: string
          property_id: string
          unit_id: string
          issue_date: string
          due_date: string
          amount: number
          status: string
          description: string | null
          send_notification: boolean
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          tenant_id: string
          property_id: string
          unit_id: string
          issue_date: string
          due_date: string
          amount: number
          status?: string
          description?: string | null
          send_notification?: boolean
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          amount: number
          sort_order: number
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          amount: number
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>
      }
      maintenance_requests: {
        Row: {
          id: string
          title: string
          property_id: string
          unit_id: string
          category: string
          priority: string
          description: string
          available_dates: string | null
          contact_preference: string
          image_urls: string[]
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          property_id: string
          unit_id: string
          category: string
          priority?: string
          description: string
          available_dates?: string | null
          contact_preference?: string
          image_urls?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['maintenance_requests']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
