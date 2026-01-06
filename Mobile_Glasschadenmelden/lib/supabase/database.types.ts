// Re-export from Web project types
// In production, this should be generated via supabase gen types

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
        }
        Update: {
          role?: UserRole
          email?: string | null
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
          versicherung_id: string
          kunde_vorname: string
          kunde_nachname: string
          kunde_telefon: string
          vers_name: string
          vers_nr: string
          fahrzeug_marke: string
          fahrzeug_modell: string
          kennzeichen: string
          vin: string
          schaden_datum: string
          schadensart: DamageType
        }
        Update: {
          status?: ClaimStatus
          werkstatt_standort_id?: string | null
        }
      }
    }
    Functions: {
      check_bootstrap_status: {
        Args: Record<string, never>
        Returns: Json
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
