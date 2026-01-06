/**
 * Supabase Database Types
 *
 * Diese Datei wird automatisch generiert via:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
 *
 * Für jetzt: Manuelle Typdefinitionen basierend auf Schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'versicherung' | 'werkstatt'
export type ClaimStatus = 'neu' | 'in_bearbeitung' | 'abgeschlossen' | 'storniert'
export type DamageType = 'steinschlag' | 'riss' | 'austausch' | 'sonstiges'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      system_settings: {
        Row: {
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
      }
      versicherungen: {
        Row: {
          id: string
          user_id: string
          firma: string
          adresse: string
          ansprechpartner: string
          email: string
          telefon: string
          bankname: string | null
          iban: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          firma: string
          adresse: string
          ansprechpartner: string
          email: string
          telefon: string
          bankname?: string | null
          iban?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          firma?: string
          adresse?: string
          ansprechpartner?: string
          email?: string
          telefon?: string
          bankname?: string | null
          iban?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      werkstaetten: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      werkstatt_standorte: {
        Row: {
          id: string
          werkstatt_id: string
          name: string
          adresse: string
          ansprechpartner: string
          telefon: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          werkstatt_id: string
          name: string
          adresse: string
          ansprechpartner: string
          telefon: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          werkstatt_id?: string
          name?: string
          adresse?: string
          ansprechpartner?: string
          telefon?: string
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      claims: {
        Row: {
          id: string
          versicherung_id: string
          werkstatt_standort_id: string | null
          status: ClaimStatus
          kunde_vorname: string
          kunde_nachname: string
          kunde_telefon: string
          vers_name: string
          vers_nr: string
          selbstbeteiligung: number
          fahrzeug_marke: string
          fahrzeug_modell: string
          kennzeichen: string
          vin: string
          schaden_datum: string
          schadensart: DamageType
          beschreibung: string | null
          provision_amount: number
          provision_paid: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          versicherung_id: string
          werkstatt_standort_id?: string | null
          status?: ClaimStatus
          kunde_vorname: string
          kunde_nachname: string
          kunde_telefon: string
          vers_name: string
          vers_nr: string
          selbstbeteiligung?: number
          fahrzeug_marke: string
          fahrzeug_modell: string
          kennzeichen: string
          vin: string
          schaden_datum: string
          schadensart: DamageType
          beschreibung?: string | null
          provision_amount?: number
          provision_paid?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          versicherung_id?: string
          werkstatt_standort_id?: string | null
          status?: ClaimStatus
          kunde_vorname?: string
          kunde_nachname?: string
          kunde_telefon?: string
          vers_name?: string
          vers_nr?: string
          selbstbeteiligung?: number
          fahrzeug_marke?: string
          fahrzeug_modell?: string
          kennzeichen?: string
          vin?: string
          schaden_datum?: string
          schadensart?: DamageType
          beschreibung?: string | null
          provision_amount?: number
          provision_paid?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      claim_attachments: {
        Row: {
          id: string
          claim_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          claim_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          claim_id?: string
          file_path?: string
          file_name?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
      }
      claim_messages: {
        Row: {
          id: string
          claim_id: string
          sender_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          claim_id: string
          sender_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          claim_id?: string
          sender_id?: string
          message?: string
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: AuditAction
          old_values: Json | null
          new_values: Json | null
          actor_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: AuditAction
          old_values?: Json | null
          new_values?: Json | null
          actor_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: AuditAction
          old_values?: Json | null
          new_values?: Json | null
          actor_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      bootstrap_admin: {
        Args: { target_user_id: string }
        Returns: Json
      }
      check_bootstrap_status: {
        Args: Record<string, never>
        Returns: Json
      }
      register_and_bootstrap_admin: {
        Args: Record<string, never>
        Returns: Json
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
    }
  }
}

// Helper Types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
