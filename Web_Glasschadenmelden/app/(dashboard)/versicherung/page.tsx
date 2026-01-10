'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ProfileEditModal } from '@/components/shared/ProfileEditModal'
import { Settings, ChevronRight, Shield, FileText, Bell, Clock, CheckCircle, LogOut, Plus } from 'lucide-react'

interface Versicherung {
  id: string
  firma: string
  ansprechpartner: string
}

interface Claim {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  status: string
  created_at: string
  vers_name: string | null
  schadensart: string
  werkstatt_name: string | null
}

export default function VersicherungDashboard() {
  const router = useRouter()
  const [versicherung, setVersicherung] = useState<Versicherung | null>(null)
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

    setUserId(user.id)
    setIsLoading(false)
  }

  async function loadClaims(versicherungId: string) {
    const { data: claimsData } = await supabase
      .from('claims')
      .select('*')
      .eq('versicherung_id', versicherungId)
      .eq('is_deleted', false)
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
      <div className="min-h-screen bg-slate-50 md:bg-gradient-subtle flex items-center justify-center">
        {/* Mobile Loading */}
        <div className="md:hidden w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        {/* Desktop Loading */}
        <div className="hidden md:block spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 md:bg-gradient-subtle">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/?home=true"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
          >
            <Shield className="w-5 h-5 text-white" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-base truncate">{versicherung?.firma || 'Dashboard'}</h1>
            <p className="text-xs text-slate-500">Versicherung</p>
          </div>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
        >
          <Settings className="w-5 h-5 text-slate-600" />
        </button>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block navbar">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/?home=true" className="logo-link">
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
            <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-medium">Versicherung</span>
            <Link href="/?home=true" className="btn-icon" title="Zur Startseite">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <button
              onClick={() => setShowProfileModal(true)}
              className="btn-icon"
              title="Profil bearbeiten"
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
      <main className="p-4 pb-28 md:pb-8 md:max-w-7xl md:mx-auto md:px-6 md:py-8">
        {/* Mobile Welcome Card */}
        <div className="md:hidden bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-purple-500/20">
          <h2 className="text-lg font-bold mb-1">
            Hallo, {versicherung?.ansprechpartner || 'Versicherung'}!
          </h2>
          <p className="text-purple-100 text-sm mb-4">
            Verwalten Sie Ihre Schadensmeldungen.
          </p>
          <Link
            href="/versicherung/schaden-melden"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg active:bg-purple-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Schaden
          </Link>
        </div>

        {/* Desktop Welcome Card */}
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 rounded-2xl p-8 mb-8 animate-fade-in-up shadow-lg">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-1">
                  Willkommen, {versicherung?.ansprechpartner}!
                </h2>
                <p className="text-purple-100">
                  Verwalten Sie Ihre Schadensmeldungen und kommunizieren Sie mit Werkstätten.
                </p>
              </div>
            </div>
            <Link href="/versicherung/schaden-melden" className="flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-purple-50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Neuer Schaden
            </Link>
          </div>
        </div>

        {/* Mobile Stats Grid */}
        <div className="md:hidden grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500">Gesamt</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.neu}</p>
            <p className="text-xs text-slate-500">Neue Meldungen</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.inBearbeitung}</p>
            <p className="text-xs text-slate-500">In Bearbeitung</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.abgeschlossen}</p>
            <p className="text-xs text-slate-500">Abgeschlossen</p>
          </div>
        </div>

        {/* Desktop Stats */}
        <div className="hidden md:grid grid-cols-4 gap-6 mb-8">
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon bg-purple-500 text-white">
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

        {/* Mobile Claims Section */}
        <div className="md:hidden bg-white rounded-2xl shadow-sm border border-slate-100 mb-5">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Aktuelle Meldungen</h3>
            <Link href="/versicherung/auftraege" className="text-sm text-purple-600 font-medium">Alle anzeigen</Link>
          </div>
          {claims.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Keine Meldungen</h4>
              <p className="text-sm text-slate-500 mb-4">Erstellen Sie Ihre erste Schadensmeldung.</p>
              <Link href="/versicherung/schaden-melden" className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-xl font-medium text-sm">
                <Plus className="w-4 h-4" />
                Schaden melden
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <Link key={claim.id} href={`/versicherung/auftraege/${claim.id}`} className="p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-purple-600 font-medium">{claim.auftragsnummer || '-'}</span>
                      <h4 className="font-semibold text-sm text-slate-900 truncate">{claim.kunde_vorname} {claim.kunde_nachname}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        claim.status === 'neu' ? 'bg-yellow-100 text-yellow-700' :
                        claim.status === 'in_bearbeitung' ? 'bg-purple-100 text-purple-700' :
                        claim.status === 'reparatur_abgeschlossen' ? 'bg-purple-100 text-purple-700' :
                        claim.status === 'storniert' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {claim.status === 'neu' ? 'Neu' :
                         claim.status === 'in_bearbeitung' ? 'In Bearb.' :
                         claim.status === 'reparatur_abgeschlossen' ? 'Rep. fertig' :
                         claim.status === 'storniert' ? 'Storniert' :
                         'Erledigt'}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(claim.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Logout Button */}
        <button
          onClick={handleLogout}
          className="md:hidden w-full py-4 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium flex items-center justify-center gap-2 active:bg-slate-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Abmelden
        </button>

        {/* Desktop Recent Claims */}
        <div className="hidden md:block card p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-3">Aktuelle Schadensmeldungen</h3>
            <Link href="/versicherung/auftraege" className="btn-link">Alle anzeigen</Link>
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
              <Link href="/versicherung/schaden-melden" className="btn-primary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schaden melden
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <Link key={claim.id} href={`/versicherung/auftraege/${claim.id}`} className="action-card">
                  <div className="icon-box flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs text-purple-600 font-medium">{claim.auftragsnummer || '-'}</span>
                      <h4 className="font-semibold">{claim.kunde_vorname} {claim.kunde_nachname}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        claim.status === 'neu' ? 'bg-yellow-100 text-yellow-700' :
                        claim.status === 'in_bearbeitung' ? 'bg-blue-100 text-blue-700' :
                        claim.status === 'reparatur_abgeschlossen' ? 'bg-purple-100 text-purple-700' :
                        claim.status === 'storniert' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {claim.status === 'neu' ? 'Neu' :
                         claim.status === 'in_bearbeitung' ? 'In Bearbeitung' :
                         claim.status === 'reparatur_abgeschlossen' ? 'Reparatur abgeschlossen' :
                         claim.status === 'storniert' ? 'Storniert' :
                         'Erledigt'}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {claim.kennzeichen || 'Kein Kennzeichen'} • {claim.werkstatt_name || 'Keine Werkstatt'} • {new Date(claim.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        role="versicherung"
        userId={userId}
        onSave={() => {
          // Reload profile data after save
          checkAuth()
        }}
      />
    </div>
  )
}
