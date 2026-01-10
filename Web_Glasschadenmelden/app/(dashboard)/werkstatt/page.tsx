'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type DamageType } from '@/lib/supabase/database.types'
import { ProfileEditModal } from '@/components/shared/ProfileEditModal'
import { StandortManageModal } from '@/components/shared/StandortManageModal'
import { Settings, ChevronRight, Wrench, MapPin, ClipboardList, Bell, Clock, CheckCircle, LogOut, Plus, DollarSign, X } from 'lucide-react'

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
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  status: string
  created_at: string
  schadensart: DamageType
  vers_name: string | null
  werkstatt_standort_id: string | null
  werkstatt_name: string | null
  vermittler_firma: string | null
  is_deleted: boolean
}

export default function WerkstattDashboard() {
  const router = useRouter()
  const [werkstatt, setWerkstatt] = useState<Werkstatt | null>(null)
  const [standorte, setStandorte] = useState<Standort[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [allClaims, setAllClaims] = useState<Claim[]>([])
  const [stats, setStats] = useState({ total: 0, neu: 0, inBearbeitung: 0, abgeschlossen: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showStandortModal, setShowStandortModal] = useState(false)
  const [showAllClaimsModal, setShowAllClaimsModal] = useState(false)
  const [editStandortId, setEditStandortId] = useState<string | null>(null)

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

      // Load all claims for stats and modal (exclude deleted)
      const { data: allClaimsData } = await supabase
        .from('claims')
        .select('*')
        .in('werkstatt_standort_id', standortIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (allClaimsData) {
        setAllClaims(allClaimsData)
        setClaims(allClaimsData.slice(0, 5)) // Only show first 5 in quick view
        setStats({
          total: allClaimsData.length,
          neu: allClaimsData.filter(c => c.status === 'neu').length,
          inBearbeitung: allClaimsData.filter(c => c.status === 'in_bearbeitung').length,
          abgeschlossen: allClaimsData.filter(c => c.status === 'abgeschlossen').length,
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
      <div className="min-h-screen bg-slate-50 md:bg-gradient-subtle flex items-center justify-center">
        {/* Mobile Loading */}
        <div className="md:hidden w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
          >
            <Wrench className="w-5 h-5 text-white" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-base truncate">{primaryStandort?.name || 'Dashboard'}</h1>
            <p className="text-xs text-slate-500">Werkstatt</p>
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
              <h1 className="text-lg font-bold">{primaryStandort?.name || 'Werkstatt'}</h1>
              <p className="text-sm text-muted">Aufträge verwalten</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-sm font-medium">Werkstatt</span>
            {standorte.length > 1 && (
              <span className="badge badge-success">{standorte.length} Standorte</span>
            )}
            <Link href="/?home=true" className="btn-icon" title="Zur Startseite">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
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
      <main className="p-4 pb-28 md:pb-8 md:max-w-7xl md:mx-auto md:px-6 md:py-8">
        {/* Mobile Welcome Card */}
        <div className="md:hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-orange-500/20">
          <h2 className="text-lg font-bold mb-1">
            Hallo, {primaryStandort?.ansprechpartner || 'Werkstatt'}!
          </h2>
          <p className="text-orange-100 text-sm mb-4">
            Bearbeiten Sie Aufträge und kommunizieren Sie mit Versicherungen.
          </p>
          <Link
            href="/werkstatt/provisionen"
            className="inline-flex items-center gap-2 bg-white/20 active:bg-white/30 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            <DollarSign className="w-4 h-4" />
            Provisionen
          </Link>
        </div>

        {/* Desktop Welcome Card */}
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-2xl p-8 mb-8 animate-fade-in-up shadow-lg">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>
          <div className="relative flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-white flex-1">
              <h2 className="text-2xl font-bold mb-1">
                Willkommen, {primaryStandort?.ansprechpartner}!
              </h2>
              <p className="text-orange-100">
                Bearbeiten Sie zugewiesene Aufträge und kommunizieren Sie mit Versicherungen.
              </p>
            </div>
            <Link
              href="/werkstatt/provisionen"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-3 rounded-xl font-semibold transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Provisionen
            </Link>
          </div>
        </div>

        {/* Mobile Standorte Badge */}
        {standorte.length > 1 && (
          <div className="md:hidden flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 font-medium">{standorte.length} Standorte verwaltet</span>
          </div>
        )}

        {/* Mobile Stats Grid */}
        <div className="md:hidden grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500">Aufträge gesamt</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.neu}</p>
            <p className="text-xs text-slate-500">Neue Aufträge</p>
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
            <p className="text-xs text-slate-500">Erledigt</p>
          </div>
        </div>

        {/* Desktop Stats */}
        <div className="hidden md:grid grid-cols-4 gap-6 mb-8">
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon bg-orange-500 text-white">
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

        {/* Mobile Standorte Section */}
        <div className="md:hidden bg-white rounded-2xl shadow-sm border border-slate-100 mb-5">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Standorte</h3>
            <button
              onClick={() => setShowStandortModal(true)}
              className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center active:bg-orange-200 transition-colors"
            >
              <Plus className="w-4 h-4 text-orange-600" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {standorte.map((standort) => (
              <button
                key={standort.id}
                onClick={() => {
                  setEditStandortId(standort.id)
                  setShowStandortModal(true)
                }}
                className="w-full p-4 flex items-center gap-3 active:bg-slate-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-sm text-slate-900 truncate">{standort.name}</h4>
                    {standort.is_primary && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Haupt</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{standort.adresse}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </button>
            ))}
            {standorte.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Keine Standorte vorhanden</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Claims Section */}
        <div className="md:hidden bg-white rounded-2xl shadow-sm border border-slate-100 mb-5">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Aktuelle Aufträge</h3>
            <Link href="/werkstatt/auftraege" className="text-sm text-orange-600 font-medium">Alle anzeigen</Link>
          </div>
          {claims.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-7 h-7 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Keine Aufträge</h4>
              <p className="text-sm text-slate-500">Neue Aufträge werden hier angezeigt.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <Link key={claim.id} href={`/werkstatt/auftraege/${claim.id}`} className="p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm text-slate-900 truncate">{claim.kunde_vorname} {claim.kunde_nachname}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        claim.status === 'neu' ? 'bg-yellow-100 text-yellow-700' :
                        claim.status === 'in_bearbeitung' ? 'bg-orange-100 text-orange-700' :
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
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart} • {new Date(claim.created_at).toLocaleDateString('de-DE')}
                    </p>
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

        {/* Desktop Grid Layout */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Standorte */}
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-3">Standorte</h3>
              <button
                onClick={() => setShowStandortModal(true)}
                className="btn-icon"
                title="Standorte verwalten"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {standorte.map((standort) => (
                <button
                  key={standort.id}
                  onClick={() => {
                    setEditStandortId(standort.id)
                    setShowStandortModal(true)
                  }}
                  className="w-full p-3 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--primary-50))] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{standort.name}</h4>
                    {standort.is_primary && (
                      <span className="badge badge-primary text-xs py-0.5 px-2">Haupt</span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{standort.adresse}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Aufträge */}
          <div className="lg:col-span-2 card p-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-3">Aktuelle Aufträge</h3>
              <Link href="/werkstatt/auftraege" className="btn-link">Alle anzeigen</Link>
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
                  <Link key={claim.id} href={`/werkstatt/auftraege/${claim.id}`} className="action-card hover:border-orange-200 transition-colors cursor-pointer">
                    <div className="icon-box flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
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
                      <p className="text-sm text-muted truncate">
                        {DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart} • {new Date(claim.created_at).toLocaleDateString('de-DE')}
                      </p>
                      {claim.versicherung && (
                        <p className="text-xs text-[hsl(var(--primary-600))] mt-1 truncate">
                          {claim.versicherung.firma} • {claim.versicherung.ansprechpartner}
                        </p>
                      )}
                      {claim.standort && (
                        <p className="text-xs text-green-600 mt-1 truncate flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {claim.standort.name} - {claim.standort.adresse}
                        </p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
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

      {/* Standort Manage Modal */}
      {werkstatt && (
        <StandortManageModal
          isOpen={showStandortModal}
          onClose={() => {
            setShowStandortModal(false)
            setEditStandortId(null)
          }}
          werkstattId={werkstatt.id}
          onUpdate={() => {
            loadStandorte(werkstatt.id)
          }}
          editStandortId={editStandortId}
        />
      )}

      {/* All Claims Modal - Responsive */}
      {showAllClaimsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl w-full md:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up md:animate-none">
            <div className="px-5 md:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">Alle Aufträge ({allClaims.length})</h2>
              <button
                onClick={() => setShowAllClaimsModal(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 md:hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {allClaims.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted">Keine Aufträge vorhanden</p>
                </div>
              ) : (
                <>
                  {/* Mobile List */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {allClaims.map((claim) => (
                      <Link
                        key={claim.id}
                        href={`/werkstatt/auftraege/${claim.id}`}
                        onClick={() => setShowAllClaimsModal(false)}
                        className="p-4 flex items-center gap-3 active:bg-slate-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">{claim.kunde_vorname} {claim.kunde_nachname}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              claim.status === 'neu' ? 'bg-yellow-100 text-yellow-700' :
                              claim.status === 'in_bearbeitung' ? 'bg-orange-100 text-orange-700' :
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
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart} • {new Date(claim.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                  {/* Desktop List */}
                  <div className="hidden md:block p-6 space-y-3">
                    {allClaims.map((claim) => (
                      <Link
                        key={claim.id}
                        href={`/werkstatt/auftraege/${claim.id}`}
                        onClick={() => setShowAllClaimsModal(false)}
                        className="block p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
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
                          <span className="text-sm text-muted">{new Date(claim.created_at).toLocaleDateString('de-DE')}</span>
                        </div>
                        <p className="text-sm text-muted">
                          {DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          {claim.versicherung && (
                            <p className="text-xs text-[hsl(var(--primary-600))]">
                              {claim.versicherung.firma}
                            </p>
                          )}
                          {claim.standort && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {claim.standort.name} - {claim.standort.adresse}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
