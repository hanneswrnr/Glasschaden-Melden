'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ProfileEditModal } from '@/components/shared/ProfileEditModal'
import { Settings, ChevronRight, Shield, Users, Building2, Wrench, FileText, Plus, BarChart3, LogOut } from 'lucide-react'

interface Profile {
  id: string
  role: string
  created_at: string
}

interface Stats {
  totalUsers: number
  totalVersicherungen: number
  totalWerkstaetten: number
  totalClaims: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVersicherungen: 0,
    totalWerkstaetten: 0,
    totalClaims: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userId, setUserId] = useState<string>('')

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

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profileData || profileData.role !== 'admin') {
      router.push('/login')
      return
    }

    setUserId(user.id)
    setProfile(profileData)
    await loadStats()
    setIsLoading(false)
  }

  async function loadStats() {
    const [users, versicherungen, werkstaetten, claims] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('versicherungen').select('id', { count: 'exact', head: true }),
      supabase.from('werkstaetten').select('id', { count: 'exact', head: true }),
      supabase.from('claims').select('id', { count: 'exact', head: true }),
    ])

    setStats({
      totalUsers: users.count || 0,
      totalVersicherungen: versicherungen.count || 0,
      totalWerkstaetten: werkstaetten.count || 0,
      totalClaims: claims.count || 0,
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white animate-icon-pulse" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base truncate">Admin Dashboard</h1>
            <p className="text-xs text-slate-500">Systemverwaltung</p>
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
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-2xl p-5 text-white mb-5 shadow-lg animate-stagger-1">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold mb-1">
              Willkommen, Administrator!
            </h2>
            <p className="text-red-100 text-sm">
              Voller Zugriff auf alle Systemfunktionen.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 animate-stagger-2">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="text-xs text-slate-500">Benutzer</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalVersicherungen}</p>
            <p className="text-xs text-slate-500">Versicherungen</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-2">
              <Wrench className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalWerkstaetten}</p>
            <p className="text-xs text-slate-500">Werkstätten</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalClaims}</p>
            <p className="text-xs text-slate-500">Schadensfälle</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5 animate-stagger-3">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Schnellaktionen</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <button className="w-full p-4 flex items-center gap-3 active:bg-slate-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-900">Versicherung hinzufügen</h4>
                <p className="text-xs text-slate-500">Neue Versicherung registrieren</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </button>
            <button className="w-full p-4 flex items-center gap-3 active:bg-slate-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-900">Werkstatt hinzufügen</h4>
                <p className="text-xs text-slate-500">Neue Werkstatt registrieren</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </button>
            <button className="w-full p-4 flex items-center gap-3 active:bg-slate-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-900">Berichte ansehen</h4>
                <p className="text-xs text-slate-500">Statistiken und Auswertungen</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5 animate-stagger-4">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Benutzerverwaltung</h3>
            <button className="text-sm text-red-600 font-medium">Alle</button>
          </div>
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Benutzer verwalten</h4>
            <p className="text-sm text-slate-500 mb-4">Verwalten Sie alle Systembenutzer</p>
            <button className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform">
              <Users className="w-4 h-4" />
              Zur Verwaltung
            </button>
          </div>
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
        role="admin"
        userId={userId}
        hideDeleteOption={true}
      />
    </div>
  )
}
