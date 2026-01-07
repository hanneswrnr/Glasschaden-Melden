'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Shield, Clock, Award, LogIn, ChevronRight, Sparkles } from 'lucide-react'
import { SplashScreen } from '@/components/mobile/SplashScreen'

export default function MobileApp() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const supabase = getSupabaseClient()

  // Check if splash has been shown this session
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash')
    if (!hasSeenSplash) {
      setShowSplash(true)
    } else {
      setShowContent(true)
    }
  }, [])

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('hasSeenSplash', 'true')
    setShowSplash(false)
    // Trigger content animations after splash
    setTimeout(() => setShowContent(true), 100)
  }, [])

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

      const userRole = (profile as { role?: string } | null)?.role

      if (userRole === 'admin') {
        router.push('/admin')
        return
      } else if (userRole === 'versicherung') {
        router.push('/versicherung')
        return
      } else if (userRole === 'werkstatt') {
        router.push('/werkstatt')
        return
      }
    }

    setIsChecking(false)
  }

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} minDuration={2500} />
  }

  // Loading state after splash (while checking auth)
  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Shield className="w-8 h-8 text-white animate-icon-pulse" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* App Header */}
      <header className={`bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 ${showContent ? 'animate-slide-in-bottom' : 'opacity-0'}`}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">GlasschadenMelden</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          <span className="font-medium">Neu</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {/* Welcome Card */}
        <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white mb-6 shadow-xl shadow-indigo-500/20 ${showContent ? 'animate-stagger-1' : 'opacity-0'}`}>
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-slow" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float-slow-reverse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Jetzt verfügbar
            </div>
            <h1 className="text-2xl font-bold mb-2">Willkommen!</h1>
            <p className="text-indigo-100 text-sm mb-5 leading-relaxed">
              Melden Sie Glasschäden schnell und unkompliziert.
            </p>
            <Link
              href="/role-selection"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-black/10 active:scale-95 transition-transform"
            >
              Jetzt starten
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className={`font-semibold text-slate-900 mb-3 px-1 ${showContent ? 'animate-stagger-2' : 'opacity-0'}`}>Schnellzugriff</h2>
        <div className={`grid grid-cols-2 gap-3 mb-6 ${showContent ? 'animate-stagger-2' : 'opacity-0'}`}>
          <Link
            href="/login"
            className="group bg-white rounded-2xl p-4 flex flex-col items-center gap-3 border border-slate-100 shadow-sm active:scale-95 transition-all hover:shadow-md hover:border-indigo-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <LogIn className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Anmelden</span>
          </Link>

          <Link
            href="/role-selection"
            className="group bg-white rounded-2xl p-4 flex flex-col items-center gap-3 border border-slate-100 shadow-sm active:scale-95 transition-all hover:shadow-md hover:border-emerald-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700">Registrieren</span>
          </Link>
        </div>

        {/* Features Section */}
        <h2 id="info" className={`font-semibold text-slate-900 mb-3 px-1 ${showContent ? 'animate-stagger-3' : 'opacity-0'}`}>Unsere Vorteile</h2>
        <div className={`space-y-3 ${showContent ? 'animate-stagger-3' : 'opacity-0'}`}>
          <div className="group bg-white rounded-2xl p-4 flex items-center gap-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Sicher & Zuverlässig</h3>
              <p className="text-sm text-slate-500">Ihre Daten sind bei uns geschützt</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="group bg-white rounded-2xl p-4 flex items-center gap-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all active:scale-[0.98]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Schnell & Effizient</h3>
              <p className="text-sm text-slate-500">Schadensmeldung in Minuten</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="group bg-white rounded-2xl p-4 flex items-center gap-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all active:scale-[0.98]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Professionell</h3>
              <p className="text-sm text-slate-500">Höchste Qualitätsstandards</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Info Cards */}
        <div className={`mt-6 space-y-4 ${showContent ? 'animate-stagger-4' : 'opacity-0'}`}>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              <h2 className="font-semibold text-slate-900">Für Versicherungen</h2>
            </div>
            <ul className="text-slate-600 text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">✓</span>
                Schäden digital erfassen
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">✓</span>
                Werkstätten zuweisen
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">✓</span>
                Status in Echtzeit verfolgen
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="font-semibold text-slate-900">Für Werkstätten</h2>
            </div>
            <ul className="text-slate-600 text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">✓</span>
                Aufträge empfangen
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">✓</span>
                Daten prüfen & korrigieren
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">✓</span>
                Provisionen verwalten
              </li>
            </ul>
          </div>
        </div>

        {/* App Version */}
        <p className={`text-center text-xs text-slate-400 mt-8 mb-4 ${showContent ? 'animate-stagger-5' : 'opacity-0'}`}>
          Version 1.0.0
        </p>
      </main>
    </div>
  )
}
