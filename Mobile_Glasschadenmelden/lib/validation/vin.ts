import { z } from 'zod'

/**
 * VIN Validator nach ISO 3779
 * - Exakt 17 Zeichen
 * - Keine Buchstaben I, O, Q (vermeiden Verwechslung mit 1, 0)
 * - Nur alphanumerisch
 */

// Regex: 17 Zeichen, keine I, O, Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/

/**
 * Zod Schema für VIN Validierung
 */
export const vinSchema = z
  .string()
  .length(17, 'VIN muss exakt 17 Zeichen lang sein')
  .regex(VIN_REGEX, 'VIN enthält ungültige Zeichen (I, O, Q sind nicht erlaubt)')
  .transform((val) => val.toUpperCase())

/**
 * Validiert eine VIN und gibt Ergebnis zurück
 */
export function validateVin(vin: string): {
  valid: boolean
  error?: string
  normalizedVin?: string
} {
  const result = vinSchema.safeParse(vin)

  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'Ungültige VIN',
    }
  }

  return {
    valid: true,
    normalizedVin: result.data,
  }
}

/**
 * Berechnet VIN Check Digit (Position 9)
 * Optional: Für erweiterte Validierung
 */
export function calculateVinCheckDigit(vin: string): string {
  const transliteration: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  }

  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 17; i++) {
    const char = vin[i].toUpperCase()
    const value = /\d/.test(char) ? parseInt(char) : transliteration[char] || 0
    sum += value * weights[i]
  }

  const remainder = sum % 11
  return remainder === 10 ? 'X' : remainder.toString()
}

export type VinValidationResult = ReturnType<typeof validateVin>
