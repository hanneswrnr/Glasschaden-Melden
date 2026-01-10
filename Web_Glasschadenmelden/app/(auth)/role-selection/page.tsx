'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PublicFooter } from '@/components/shared/PublicFooter'

export default function RoleSelectionPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin')
        return
      } else if (profile?.role === 'versicherung') {
        router.push('/versicherung')
        return
      } else if (profile?.role === 'werkstatt') {
        router.push('/werkstatt')
        return
      }
    }

    setIsChecking(false)
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary-500))] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-900">Glasschaden<span className="text-[hsl(var(--primary-500))]">Melden</span></span>
        </Link>
        <Link
          href="/login"
          className="px-3 py-2 rounded-xl bg-[hsl(var(--primary-500))] text-white text-sm font-medium flex items-center gap-1.5 active:bg-[hsl(var(--primary-600))] transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>Anmelden</span>
        </Link>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block navbar">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="logo-link">
            <div className="logo-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="logo-text">Glasschaden<span className="logo-text-accent">Melden</span></span>
          </Link>
          <Link href="/login" className="btn-ghost text-sm">
            Bereits registriert? Anmelden
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="icon-box icon-box-lg icon-box-primary mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="heading-1 mb-4">Wählen Sie Ihre Rolle</h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Registrieren Sie sich als Werkstatt oder Versicherung, um Zugang zu Ihrer spezifischen Plattform zu erhalten.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Werkstatt */}
          <div className="role-card card-shimmer animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="role-icon">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="heading-2 mb-3">Für Werkstätten</h3>
            <p className="text-muted mb-6">
              Als Partner-Werkstatt erhalten Sie direkten Zugang zu Schadensmeldungen,
              können Aufträge verwalten und die Abwicklung mit Versicherungen optimieren.
            </p>
            <div className="space-y-3">
              <Link href="/register/werkstatt" className="btn-primary w-full">
                Als Werkstatt registrieren
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link href="/login" className="btn-link block">
                Bereits registriert? Anmelden
              </Link>
            </div>
          </div>

          {/* Versicherung */}
          <div className="role-card card-shimmer animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="role-icon">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="heading-2 mb-3">Für Versicherungen</h3>
            <p className="text-muted mb-6">
              Als Versicherungsvertreter können Sie Schadensmeldungen einsehen, bearbeiten
              und die Kommunikation mit Werkstätten zentral verwalten.
            </p>
            <div className="space-y-3">
              <Link href="/register/versicherung" className="btn-primary w-full">
                Als Versicherung registrieren
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link href="/login" className="btn-link block">
                Bereits registriert? Anmelden
              </Link>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="max-w-2xl mx-auto mt-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="info-card p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary-500))] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-lg">Sie haben bereits einen Account?</span>
            </div>
            <p className="text-muted mb-6">
              Melden Sie sich direkt an und werden automatisch zu Ihrem Dashboard weitergeleitet.
            </p>
            <Link href="/login" className="btn-primary">
              Zum Login
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
