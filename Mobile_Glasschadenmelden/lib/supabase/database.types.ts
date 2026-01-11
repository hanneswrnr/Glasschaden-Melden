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
export type ClaimStatus = 'neu' | 'in_bearbeitung' | 'reparatur_abgeschlossen' | 'abgeschlossen' | 'storniert'
export type DamageType = 'steinschlag' | 'riss' | 'austausch' | 'sonstiges' | 'frontscheibe_steinschlag' | 'frontscheibe_austausch' | 'seitenscheibe_austausch' | 'heckscheibe_austausch'
export type PaymentStatus = 'nicht_bezahlt' | 'bezahlt'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

// Mapping für Schadensart-Anzeige
// WICHTIG: Alle Labels müssen die vollständige Beschreibung wie im Formular zeigen
export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  steinschlag: 'Frontscheibe Steinschlagreparatur',
  riss: 'Riss',
  austausch: 'Frontscheibe Austausch',
  sonstiges: 'Sonstiges',
  frontscheibe_steinschlag: 'Frontscheibe Steinschlagreparatur',
  frontscheibe_austausch: 'Frontscheibe Austausch',
  seitenscheibe_austausch: 'Seitenscheibe Austausch',
  heckscheibe_austausch: 'Heckscheibe Austausch',
}

// Mapping für Status-Anzeige
export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  neu: 'Neu',
  in_bearbeitung: 'In Bearbeitung',
  reparatur_abgeschlossen: 'Reparatur abgeschlossen',
  abgeschlossen: 'Erledigt',
  storniert: 'Storniert',
}

// Mapping für Payment Status
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  nicht_bezahlt: 'Nicht bezahlt',
  bezahlt: 'Bezahlt',
}

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
          auftragsnummer: string
          versicherung_id: string
          werkstatt_standort_id: string | null
          werkstatt_name: string | null
          vermittler_firma: string | null
          status: ClaimStatus
          payment_status: PaymentStatus
          kunde_vorname: string
          kunde_nachname: string
          kunde_telefon: string
          vers_name: string | null
          vers_nr: string | null
          selbstbeteiligung: number | null
          fahrzeug_marke: string | null
          fahrzeug_modell: string | null
          kennzeichen: string | null
          vin: string | null
          schaden_datum: string
          schadensart: DamageType
          beschreibung: string | null
          provision_amount: number
          provision_paid: boolean
          is_archived: boolean
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          auftragsnummer?: string
          versicherung_id: string
          werkstatt_standort_id?: string | null
          werkstatt_name?: string | null
          vermittler_firma?: string | null
          status?: ClaimStatus
          payment_status?: PaymentStatus
          kunde_vorname: string
          kunde_nachname: string
          kunde_telefon: string
          vers_name?: string | null
          vers_nr?: string | null
          selbstbeteiligung?: number | null
          fahrzeug_marke?: string | null
          fahrzeug_modell?: string | null
          kennzeichen?: string | null
          vin?: string | null
          schaden_datum: string
          schadensart: DamageType
          beschreibung?: string | null
          provision_amount?: number
          provision_paid?: boolean
          is_archived?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          auftragsnummer?: string
          versicherung_id?: string
          werkstatt_standort_id?: string | null
          werkstatt_name?: string | null
          vermittler_firma?: string | null
          status?: ClaimStatus
          payment_status?: PaymentStatus
          kunde_vorname?: string
          kunde_nachname?: string
          kunde_telefon?: string
          vers_name?: string | null
          vers_nr?: string | null
          selbstbeteiligung?: number | null
          fahrzeug_marke?: string | null
          fahrzeug_modell?: string | null
          kennzeichen?: string | null
          vin?: string | null
          schaden_datum?: string
          schadensart?: DamageType
          beschreibung?: string | null
          provision_amount?: number
          provision_paid?: boolean
          is_archived?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      provision_configs: {
        Row: {
          id: string
          versicherung_id: string | null
          frontscheibe_steinschlag: number
          frontscheibe_austausch: number
          seitenscheibe_austausch: number
          heckscheibe_austausch: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          versicherung_id?: string | null
          frontscheibe_steinschlag?: number
          frontscheibe_austausch?: number
          seitenscheibe_austausch?: number
          heckscheibe_austausch?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          versicherung_id?: string | null
          frontscheibe_steinschlag?: number
          frontscheibe_austausch?: number
          seitenscheibe_austausch?: number
          heckscheibe_austausch?: number
          created_at?: string
          updated_at?: string
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
      message_attachments: {
        Row: {
          id: string
          message_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_path?: string
          file_name?: string
          file_type?: string
          file_size?: number
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
      soft_delete_claim: {
        Args: { claim_uuid: string }
        Returns: boolean
      }
      restore_claim: {
        Args: { claim_uuid: string }
        Returns: boolean
      }
      permanent_delete_claim: {
        Args: { claim_uuid: string }
        Returns: boolean
      }
      unassign_claims_from_standort: {
        Args: { standort_uuid: string }
        Returns: number
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

// Chat Message Types (with joined data)
export interface ChatMessage {
  id: string
  claim_id: string
  sender_id: string
  message: string
  created_at: string
  // Joined data from profiles + versicherungen/werkstatt_standorte
  sender?: {
    id: string
    display_name: string | null
    company_name: string | null
    address?: string | null
    role: UserRole
  }
  // Joined attachments
  attachments?: MessageAttachment[]
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  // Computed URL for display
  url?: string
}

// Chat Sender Info for display
export interface ChatSender {
  id: string
  name: string
  role: UserRole
}

// Role colors for chat bubbles
export const CHAT_ROLE_COLORS: Record<UserRole, { bg: string; text: string; badge: string }> = {
  werkstatt: {
    bg: 'bg-orange-50',
    text: 'text-orange-900',
    badge: 'bg-orange-500 text-white'
  },
  versicherung: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    badge: 'bg-purple-500 text-white'
  },
  admin: {
    bg: 'bg-red-50',
    text: 'text-red-900',
    badge: 'bg-red-500 text-white'
  }
}
