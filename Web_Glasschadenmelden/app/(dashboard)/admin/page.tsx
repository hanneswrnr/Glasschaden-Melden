'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'

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
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted">Systemverwaltung</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="badge badge-primary">Administrator</span>
            <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Card */}
        <div className="card card-shimmer p-8 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-6">
            <div className="icon-box icon-box-lg icon-box-primary">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="heading-2 mb-1">
                Willkommen, <span className="text-gradient">Administrator</span>!
              </h2>
              <p className="text-muted">
                Sie haben vollen Zugriff auf alle Funktionen des Systems.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            label="Benutzer"
            value={stats.totalUsers}
            color="bg-blue-500"
            delay={0}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            label="Versicherungen"
            value={stats.totalVersicherungen}
            color="bg-purple-500"
            delay={0.1}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Werkstätten"
            value={stats.totalWerkstaetten}
            color="bg-orange-500"
            delay={0.2}
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            label="Schadensfälle"
            value={stats.totalClaims}
            color="bg-green-500"
            delay={0.3}
          />
        </div>

        {/* Quick Actions */}
        <div className="card card-shimmer p-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="heading-3 mb-6">Schnellaktionen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
              title="Versicherung hinzufügen"
              description="Neue Versicherung im System registrieren"
            />
            <ActionCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              title="Werkstatt hinzufügen"
              description="Neue Werkstatt im System registrieren"
            />
            <ActionCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Berichte ansehen"
              description="Statistiken und Auswertungen"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  delay: number
}) {
  return (
    <div
      className="stat-card animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`stat-icon ${color} text-white`}>
        {icon}
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  )
}

function ActionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button className="action-card w-full text-left">
      <div className="icon-box icon-box-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
