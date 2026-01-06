import { z } from 'zod'
import { vinSchema } from './vin'

/**
 * Zentrale Zod Schemas für alle Formulare
 */

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
})

export const registerBaseSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Passwort muss Groß-, Kleinbuchstaben und Zahlen enthalten'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

// ============================================
// Versicherung Schemas
// ============================================

export const versicherungSchema = z.object({
  firma: z.string().min(2, 'Firmenname erforderlich'),
  adresse: z.string().min(5, 'Adresse erforderlich'),
  ansprechpartner: z.string().min(2, 'Ansprechpartner erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  telefon: z
    .string()
    .min(5, 'Telefonnummer erforderlich')
    .regex(/^[\d\s\-+()]+$/, 'Ungültige Telefonnummer'),
  bankname: z.string().optional(),
  iban: z
    .string()
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/, 'Ungültige IBAN')
    .optional()
    .or(z.literal('')),
})

// ============================================
// Werkstatt Schemas
// ============================================

export const werkstattStandortSchema = z.object({
  name: z.string().min(2, 'Standortname erforderlich'),
  adresse: z.string().min(5, 'Adresse erforderlich'),
  ansprechpartner: z.string().min(2, 'Ansprechpartner erforderlich'),
  telefon: z
    .string()
    .min(5, 'Telefonnummer erforderlich')
    .regex(/^[\d\s\-+()]+$/, 'Ungültige Telefonnummer'),
  is_primary: z.boolean().default(false),
})

// ============================================
// Claim Schemas
// ============================================

export const kundenDatenSchema = z.object({
  kunde_vorname: z.string().min(2, 'Vorname erforderlich'),
  kunde_nachname: z.string().min(2, 'Nachname erforderlich'),
  kunde_telefon: z
    .string()
    .min(5, 'Telefonnummer erforderlich')
    .regex(/^[\d\s\-+()]+$/, 'Ungültige Telefonnummer'),
  vers_name: z.string().min(2, 'Versicherungsname erforderlich'),
  vers_nr: z.string().min(3, 'Versicherungsnummer erforderlich'),
  selbstbeteiligung: z.coerce.number().min(0).default(0),
})

export const fahrzeugDatenSchema = z.object({
  fahrzeug_marke: z.string().min(2, 'Fahrzeugmarke erforderlich'),
  fahrzeug_modell: z.string().min(1, 'Fahrzeugmodell erforderlich'),
  kennzeichen: z
    .string()
    .min(3, 'Kennzeichen erforderlich')
    .regex(/^[A-ZÄÖÜ]{1,3}[\s-]?[A-Z]{1,2}[\s-]?\d{1,4}[EH]?$/i, 'Ungültiges Kennzeichen'),
  vin: vinSchema,
})

export const schadenDatenSchema = z.object({
  schaden_datum: z.coerce.date(),
  schadensart: z.enum(['steinschlag', 'riss', 'austausch', 'sonstiges']),
  beschreibung: z.string().optional(),
})

// Vollständiges Claim Schema (für Wizard)
export const claimSchema = kundenDatenSchema
  .merge(fahrzeugDatenSchema)
  .merge(schadenDatenSchema)
  .extend({
    werkstatt_standort_id: z.string().uuid().optional(),
  })

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerBaseSchema>
export type VersicherungInput = z.infer<typeof versicherungSchema>
export type WerkstattStandortInput = z.infer<typeof werkstattStandortSchema>
export type KundenDatenInput = z.infer<typeof kundenDatenSchema>
export type FahrzeugDatenInput = z.infer<typeof fahrzeugDatenSchema>
export type SchadenDatenInput = z.infer<typeof schadenDatenSchema>
export type ClaimInput = z.infer<typeof claimSchema>
