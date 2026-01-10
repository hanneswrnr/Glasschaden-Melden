'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type DamageType } from '@/lib/supabase/database.types'
import { Settings, ChevronRight, Wrench, MapPin, ClipboardList, Bell, Clock, CheckCircle, LogOut, Plus, DollarSign, X } from 'lucide-react'
import { ProfileEditModal } from '@/components/shared/ProfileEditModal'
import { StandortManageModal } from '@/components/shared/StandortManageModal'

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
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  status: string
  created_at: string
  schadensart: DamageType
  vers_name: string | null
  werkstatt_standort_id: string | null
  versicherung?: {
    firma: string
    ansprechpartner: string
  }
  standort?: {
    name: string
    adresse: string
  }
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Wrench className="w-5 h-5 text-white" />
          </div>
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

      {/* Main Content */}
      <main className="p-4 pb-28">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 mb-5 text-white shadow-lg shadow-orange-500/20">
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

        {/* Standorte Badge */}
        {standorte.length > 1 && (
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 font-medium">{standorte.length} Standorte verwaltet</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
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

        {/* Standorte Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5">
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

        {/* Claims Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Aktuelle Aufträge</h3>
            <button onClick={() => setShowAllClaimsModal(true)} className="text-sm text-orange-600 font-medium">Alle anzeigen</button>
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
                    {claim.versicherung && (
                      <p className="text-xs text-orange-600 mt-0.5 truncate">
                        {claim.versicherung.firma}
                      </p>
                    )}
                    {claim.standort && (
                      <p className="text-xs text-green-600 mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {claim.standort.name} - {claim.standort.adresse}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium flex items-center justify-center gap-2 active:bg-slate-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Abmelden
        </button>
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        role="werkstatt"
        userId={userId}
        onSave={() => {
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

      {/* All Claims Modal */}
      {showAllClaimsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Alle Aufträge ({allClaims.length})</h2>
              <button
                onClick={() => setShowAllClaimsModal(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {allClaims.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500">Keine Aufträge vorhanden</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
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
                        {claim.versicherung && (
                          <p className="text-xs text-orange-600 mt-0.5 truncate">
                            {claim.versicherung.firma}
                          </p>
                        )}
                        {claim.standort && (
                          <p className="text-xs text-green-600 mt-0.5 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {claim.standort.name} - {claim.standort.adresse}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
