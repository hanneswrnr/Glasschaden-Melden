import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility für Tailwind Class Merging
 * Kombiniert clsx und tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatiert ein Datum für die Anzeige
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatiert ein Datum mit Uhrzeit
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatiert einen Geldbetrag
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Kürzt einen String auf maximal n Zeichen
 */
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '...' : str
}

/**
 * Debounce Funktion
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Generiert einen zufälligen String (für IDs etc.)
 */
export function generateId(length = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}
