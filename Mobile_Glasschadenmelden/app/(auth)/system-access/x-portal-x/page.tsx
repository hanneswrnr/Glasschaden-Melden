'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'

/**
 * Versteckte Admin-Bootstrap-Route - Professionelles Design
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  // Bootstrap nicht verfügbar
  if (!isAvailable) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="card-elevated p-10 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="heading-2 mb-3">Zugang gesperrt</h1>
          <p className="text-muted mb-6">
            Der Admin-Bootstrap wurde bereits durchgeführt.
            Diese Funktion ist permanent deaktiviert.
          </p>
          <Link href="/login" className="btn-primary">
            Zum Login
          </Link>
        </div>
      </div>
    )
  }

  // Bootstrap verfügbar
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="navbar">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="logo-link">
            <div className="logo-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="logo-text">Glasschaden<span className="logo-text-accent">Melden</span></span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="card-elevated card-shimmer p-8 animate-fade-in-up">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="icon-box icon-box-lg icon-box-primary mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="heading-2 mb-2">System Administrator</h1>
              <p className="text-muted mb-4">
                Erstellen Sie den ersten Administrator-Account
              </p>
              <div className="badge badge-warning">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Einmalige Aktion
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="input-label">
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
                  className="input"
                  placeholder="admin@beispiel.de"
                />
              </div>

              <div>
                <label htmlFor="password" className="input-label">
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
                  className="input"
                  placeholder="Mindestens 8 Zeichen"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="input-label">
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
                  className="input"
                  placeholder="Passwort wiederholen"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    Wird eingerichtet...
                  </span>
                ) : (
                  <>
                    Administrator erstellen
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-[hsl(var(--primary-50))] rounded-xl border border-[hsl(var(--primary-200))]">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[hsl(var(--primary-500))] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-sm text-[hsl(var(--primary-700))]">
                  Nach der Erstellung ist diese Route permanent deaktiviert.
                  Bewahren Sie Ihre Zugangsdaten sicher auf.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
