'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * Versteckte Admin-Bootstrap-Route
 * Zugang: Strg + Umschalt + A -> Dieses Modal/Seite
 *
 * WICHTIG: Diese Funktion ist NUR EINMAL verfügbar!
 * Der erste User, der sich hier registriert, wird Admin.
 * Danach ist diese Route permanent deaktiviert.
 */
export default function AdminBootstrapPage() {
  const router = useRouter()
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  const supabase = getSupabaseClient()

  // Prüfe Bootstrap-Status beim Laden
  useEffect(() => {
    checkBootstrapStatus()
  }, [])

  async function checkBootstrapStatus() {
    const { data, error } = await supabase.rpc('check_bootstrap_status')

    if (error) {
      console.error('Bootstrap Status Fehler:', error)
      setIsAvailable(false)
      return
    }

    setIsAvailable(data?.available === true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen haben')
      return
    }

    setIsLoading(true)

    try {
      // 1. Registriere User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        toast.error(`Registrierung fehlgeschlagen: ${authError.message}`)
        return
      }

      if (!authData.user) {
        toast.error('Registrierung fehlgeschlagen')
        return
      }

      // 2. Führe Admin-Bootstrap durch
      const { data: bootstrapResult, error: bootstrapError } = await supabase.rpc(
        'register_and_bootstrap_admin'
      )

      if (bootstrapError) {
        toast.error(`Bootstrap fehlgeschlagen: ${bootstrapError.message}`)
        return
      }

      if (!bootstrapResult?.success) {
        toast.error(bootstrapResult?.message || 'Bootstrap fehlgeschlagen')
        return
      }

      // Erfolg!
      toast.success('Admin erfolgreich eingerichtet!')
      router.push('/admin')
    } catch (error) {
      console.error('Bootstrap Fehler:', error)
      toast.error('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading State
  if (isAvailable === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Bootstrap nicht verfügbar
  if (!isAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Zugang gesperrt
          </h1>
          <p className="text-slate-600">
            Der Admin-Bootstrap wurde bereits durchgeführt.
            Diese Funktion ist permanent deaktiviert.
          </p>
        </div>
      </div>
    )
  }

  // Bootstrap verfügbar - Registrierungsformular
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-2xl font-bold text-slate-900">
            System Administrator Setup
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Erstellen Sie den ersten Administrator-Account.
            <br />
            <span className="text-amber-600 font-medium">
              Diese Aktion kann nur einmal durchgeführt werden!
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="admin@beispiel.de"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Passwort bestätigen
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Passwort wiederholen"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Wird eingerichtet...
              </span>
            ) : (
              'Administrator erstellen'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
