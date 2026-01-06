'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const supabase = getSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        toast.error(`Login fehlgeschlagen: ${error.message}`)
        return
      }

      if (!data.user) {
        toast.error('Login fehlgeschlagen')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      toast.success('Erfolgreich eingeloggt!')

      if (profile?.role === 'admin') {
        router.push('/admin')
      } else if (profile?.role === 'versicherung') {
        router.push('/versicherung')
      } else if (profile?.role === 'werkstatt') {
        router.push('/werkstatt')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

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
          {/* Login Card */}
          <div className="card-elevated card-shimmer p-8 animate-fade-in-up">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="icon-box icon-box-lg icon-box-primary mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="heading-2 mb-2">Willkommen zurück</h1>
              <p className="text-muted">
                Melden Sie sich an, um fortzufahren
              </p>
            </div>

            {/* Login Form */}
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
                  placeholder="ihre@email.de"
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
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input"
                  placeholder="Ihr Passwort"
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
                    Wird angemeldet...
                  </span>
                ) : (
                  <>
                    Anmelden
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider" />

            {/* Register Links */}
            <div className="text-center">
              <p className="text-muted text-sm mb-4">
                Noch kein Account?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/register/versicherung"
                  className="btn-secondary"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Versicherung
                </Link>
                <Link
                  href="/register/werkstatt"
                  className="btn-secondary"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Werkstatt
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Hint */}
          <p className="text-center text-xs text-muted mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Tipp: Drücken Sie Strg+Umschalt+A für Admin-Zugang
          </p>
        </div>
      </main>
    </div>
  )
}
