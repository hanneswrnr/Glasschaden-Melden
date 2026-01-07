'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Settings, Plus, FileText, ChevronRight, Shield } from 'lucide-react'
import { ProfileEditModal } from '@/components/shared/ProfileEditModal'

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white animate-icon-pulse" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base truncate">{versicherung?.firma || 'Dashboard'}</h1>
            <p className="text-xs text-slate-500">Versicherung</p>
          </div>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Settings className="w-5 h-5 text-slate-600" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-28">
        {/* Welcome Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 rounded-2xl p-5 text-white mb-5 shadow-lg animate-stagger-1">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-1">
              Willkommen, {versicherung?.ansprechpartner?.split(' ')[0]}!
            </h2>
            <p className="text-purple-100 text-sm mb-4">
              Verwalten Sie Ihre Schadensmeldungen.
            </p>
            <button className="inline-flex items-center gap-2 bg-white text-purple-600 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg active:scale-95 transition-transform">
              <Plus className="w-4 h-4" />
              Neuer Schaden
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 animate-stagger-2">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500">Gesamt</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.neu}</p>
            <p className="text-xs text-slate-500">Neue Meldungen</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.inBearbeitung}</p>
            <p className="text-xs text-slate-500">In Bearbeitung</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.abgeschlossen}</p>
            <p className="text-xs text-slate-500">Abgeschlossen</p>
          </div>
        </div>

        {/* Recent Claims */}
        <div className="animate-stagger-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Aktuelle Meldungen</h3>
            <button className="text-sm text-purple-600 font-medium">Alle anzeigen</button>
          </div>

          {claims.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Keine Meldungen</h4>
              <p className="text-sm text-slate-500 mb-4">Erstellen Sie Ihre erste Schadensmeldung.</p>
              <button className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform">
                <Plus className="w-4 h-4" />
                Schaden melden
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-slate-100 active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-slate-900 truncate">{claim.vorname} {claim.nachname}</h4>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        claim.status === 'neu' ? 'bg-amber-100 text-amber-700' :
                        claim.status === 'in_bearbeitung' ? 'bg-purple-100 text-purple-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {claim.status === 'neu' ? 'Neu' :
                         claim.status === 'in_bearbeitung' ? 'In Arbeit' :
                         'Fertig'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {claim.kennzeichen} • {new Date(claim.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-6 animate-stagger-4">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium text-sm active:scale-[0.98] transition-transform"
          >
            Abmelden
          </button>
        </div>
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        role="versicherung"
        userId={userId}
        onSave={() => {
          checkAuth()
        }}
      />
    </div>
  )
}
