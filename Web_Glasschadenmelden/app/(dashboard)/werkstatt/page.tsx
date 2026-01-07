'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ProfileEditModal } from '@/components/shared/ProfileEditModal'

interface Werkstatt {
  id: string
}

interface Standort {
  id: string
  name: string
  adresse: string
  ansprechpartner: string
  is_primary: boolean
}

interface Claim {
  id: string
  vorname: string
  nachname: string
  kennzeichen: string
  status: string
  created_at: string
}

export default function WerkstattDashboard() {
  const router = useRouter()
  const [werkstatt, setWerkstatt] = useState<Werkstatt | null>(null)
  const [standorte, setStandorte] = useState<Standort[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [stats, setStats] = useState({ total: 0, neu: 0, inBearbeitung: 0, abgeschlossen: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [showProfileModal, setShowProfileModal] = useState(false)

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

    if (!profile || profile.role !== 'werkstatt') {
      router.push('/login')
      return
    }

    // Hole Werkstatt
    const { data: werkstattData } = await supabase
      .from('werkstaetten')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (werkstattData) {
      setWerkstatt(werkstattData)
      await loadStandorte(werkstattData.id)
      await loadClaims(werkstattData.id)
    }

    setUserId(user.id)
    setIsLoading(false)
  }

  async function loadStandorte(werkstattId: string) {
    const { data: standorteData } = await supabase
      .from('werkstatt_standorte')
      .select('*')
      .eq('werkstatt_id', werkstattId)
      .order('is_primary', { ascending: false })

    if (standorteData) {
      setStandorte(standorteData)
    }
  }

  async function loadClaims(werkstattId: string) {
    // Hole Claims über Standorte
    const { data: standorteData } = await supabase
      .from('werkstatt_standorte')
      .select('id')
      .eq('werkstatt_id', werkstattId)

    if (standorteData && standorteData.length > 0) {
      const standortIds = standorteData.map(s => s.id)

      const { data: claimsData } = await supabase
        .from('claims')
        .select('*')
        .in('werkstatt_standort_id', standortIds)
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
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const primaryStandort = standorte.find(s => s.is_primary) || standorte[0]

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
              <h1 className="text-lg font-bold">{primaryStandort?.name || 'Werkstatt'}</h1>
              <p className="text-sm text-muted">Aufträge verwalten</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="badge badge-primary">Werkstatt</span>
            {standorte.length > 1 && (
              <span className="badge badge-success">{standorte.length} Standorte</span>
            )}
            <button
              onClick={() => setShowProfileModal(true)}
              className="btn-icon"
              title="Standorte verwalten"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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
          <div className="flex items-center gap-6">
            <div className="icon-box icon-box-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="heading-2 mb-1">
                Willkommen, <span className="text-gradient">{primaryStandort?.ansprechpartner}</span>!
              </h2>
              <p className="text-muted">
                Bearbeiten Sie zugewiesene Aufträge und kommunizieren Sie mit Versicherungen.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon bg-blue-500 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="stat-value">{stats.total}</p>
            <p className="stat-label">Aufträge gesamt</p>
          </div>
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="stat-icon bg-yellow-500 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="stat-value">{stats.neu}</p>
            <p className="stat-label">Neue Aufträge</p>
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
            <p className="stat-label">Erledigt</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Standorte */}
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-3">Standorte</h3>
              <button className="btn-icon">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {standorte.map((standort) => (
                <div key={standort.id} className="p-3 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--primary-50))] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{standort.name}</h4>
                    {standort.is_primary && (
                      <span className="badge badge-primary text-xs py-0.5 px-2">Haupt</span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{standort.adresse}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Aufträge */}
          <div className="lg:col-span-2 card p-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-3">Aktuelle Aufträge</h3>
              <button className="btn-link">Alle anzeigen</button>
            </div>

            {claims.length === 0 ? (
              <div className="text-center py-8">
                <div className="icon-box mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-1">Keine Aufträge</h4>
                <p className="text-sm text-muted">Neue Aufträge werden hier angezeigt.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div key={claim.id} className="action-card">
                    <div className="icon-box flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
                           'Erledigt'}
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
        </div>
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        role="werkstatt"
        userId={userId}
        onSave={() => {
          // Reload profile data after save
          checkAuth()
        }}
      />
    </div>
  )
}
