'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Shield, Clock, Award, LogIn, ChevronRight, Sparkles } from 'lucide-react'
import { SplashScreen } from '@/components/mobile/SplashScreen'

export default function MobileApp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSplash, setShowSplash] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = getSupabaseClient()

  // Check if user explicitly wants to stay on homepage
  const stayOnHome = searchParams.get('home') === 'true'

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
  }, [stayOnHome])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = (profile as { role?: string } | null)?.role

      // Mark as logged in
      setIsLoggedIn(true)

      // Only redirect if user didn't explicitly navigate to home
      if (!stayOnHome) {
        if (role === 'admin') {
          router.push('/admin')
          return
        } else if (role === 'versicherung') {
          router.push('/versicherung')
          return
        } else if (role === 'werkstatt') {
          router.push('/werkstatt')
          return
        }
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

          <div className="relative text-center">
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

        {/* Quick Actions - Only show when NOT logged in */}
        {!isLoggedIn && (
          <>
            <h2 className={`font-semibold text-slate-900 mb-3 text-center ${showContent ? 'animate-stagger-2' : 'opacity-0'}`}>Schnellzugriff</h2>
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
          </>
        )}

        {/* Features Section */}
        <div className={`text-center mb-4 ${showContent ? 'animate-stagger-3' : 'opacity-0'}`}>
          <h2 id="info" className="text-xl font-bold text-slate-900 mb-1">Unsere Vorteile</h2>
          <p className="text-sm text-slate-500">Was uns auszeichnet</p>
        </div>
        <div className={`space-y-3 ${showContent ? 'animate-stagger-3' : 'opacity-0'}`}>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Sicher & Zuverlässig</h3>
            <p className="text-sm text-slate-500">Ihre Daten sind bei uns geschützt</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Schnell & Effizient</h3>
            <p className="text-sm text-slate-500">Schadensmeldung in Minuten</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Professionell</h3>
            <p className="text-sm text-slate-500">Höchste Qualitätsstandards</p>
          </div>
        </div>

        {/* Partner Section */}
        <div className={`text-center mt-8 mb-4 ${showContent ? 'animate-stagger-4' : 'opacity-0'}`}>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Unsere Partner</h2>
          <p className="text-sm text-slate-500">Für wen wir da sind</p>
        </div>
        <div className={`space-y-4 ${showContent ? 'animate-stagger-4' : 'opacity-0'}`}>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <h2 className="font-semibold text-slate-900 mb-3">Für Versicherungen</h2>
            <ul className="text-slate-600 text-sm space-y-2 inline-block text-left">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">✓</span>
                Schäden digital erfassen
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">✓</span>
                Werkstätten zuweisen
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">✓</span>
                Status in Echtzeit verfolgen
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="font-semibold text-slate-900 mb-3">Für Werkstätten</h2>
            <ul className="text-slate-600 text-sm space-y-2 inline-block text-left">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">✓</span>
                Aufträge empfangen
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">✓</span>
                Daten prüfen & korrigieren
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">✓</span>
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
