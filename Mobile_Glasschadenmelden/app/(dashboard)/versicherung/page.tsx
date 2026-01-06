'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Versicherung {
  id: string
  firma: string
  ansprechpartner: string
}

interface Claim {
  id: string
  vorname: string
  nachname: string
  kennzeichen: string
  status: string
  created_at: string
}

export default function VersicherungDashboard() {
  const router = useRouter()
  const [versicherung, setVersicherung] = useState<Versicherung | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [stats, setStats] = useState({ total: 0, neu: 0, inBearbeitung: 0, abgeschlossen: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'versicherung') {
      router.push('/login')
      return
    }

    // Hole Versicherung
    const { data: versicherungData } = await supabase
      .from('versicherungen')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (versicherungData) {
      setVersicherung(versicherungData)
      await loadClaims(versicherungData.id)
    }

    setIsLoading(false)
  }

  async function loadClaims(versicherungId: string) {
    const { data: claimsData } = await supabase
      .from('claims')
      .select('*')
      .eq('versicherung_id', versicherungId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (claimsData) {
      setClaims(claimsData)
      setStats({
        total: claimsData.length,
        neu: claimsData.filter(c => c.status === 'neu').length,
        inBearbeitung: claimsData.filter(c => c.status === 'in_bearbeitung').length,
        abgeschlossen: claimsData.filter(c => c.status === 'abgeschlossen').length,
      })
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="navbar">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="logo-link">
              <div className="logo-icon">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="logo-text">Glasschaden<span className="logo-text-accent">Melden</span></span>
            </Link>
            <div className="h-8 w-px bg-[hsl(var(--border))]" />
            <div>
              <h1 className="text-lg font-bold">{versicherung?.firma || 'Versicherung'}</h1>
              <p className="text-sm text-muted">Schadensmeldungen verwalten</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="badge badge-primary">Versicherung</span>
            <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="card p-8 mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="icon-box icon-box-lg">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="heading-2 mb-1">
                  Willkommen, <span className="text-gradient">{versicherung?.ansprechpartner}</span>!
                </h2>
                <p className="text-muted">
                  Verwalten Sie Ihre Schadensmeldungen und kommunizieren Sie mit Werkstätten.
                </p>
              </div>
            </div>
            <button className="btn-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Neuer Schaden
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon bg-blue-500 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="stat-value">{stats.total}</p>
            <p className="stat-label">Gesamt</p>
          </div>
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="stat-icon bg-yellow-500 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="stat-value">{stats.neu}</p>
            <p className="stat-label">Neue Meldungen</p>
          </div>
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon bg-orange-500 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="stat-value">{stats.inBearbeitung}</p>
            <p className="stat-label">In Bearbeitung</p>
          </div>
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="stat-icon bg-green-500 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="stat-value">{stats.abgeschlossen}</p>
            <p className="stat-label">Abgeschlossen</p>
          </div>
        </div>

        {/* Recent Claims */}
        <div className="card p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-3">Aktuelle Schadensmeldungen</h3>
            <button className="btn-link">Alle anzeigen</button>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-12">
              <div className="icon-box icon-box-lg mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Keine Schadensmeldungen</h4>
              <p className="text-muted mb-4">Erstellen Sie Ihre erste Schadensmeldung.</p>
              <button className="btn-primary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schaden melden
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <div key={claim.id} className="action-card">
                  <div className="icon-box flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold">{claim.vorname} {claim.nachname}</h4>
                      <span className={`badge ${
                        claim.status === 'neu' ? 'badge-warning' :
                        claim.status === 'in_bearbeitung' ? 'badge-primary' :
                        'badge-success'
                      }`}>
                        {claim.status === 'neu' ? 'Neu' :
                         claim.status === 'in_bearbeitung' ? 'In Bearbeitung' :
                         'Abgeschlossen'}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {claim.kennzeichen} • {new Date(claim.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
