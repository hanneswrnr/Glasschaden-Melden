'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft, Building2, Wrench, ChevronRight, Users, Shield } from 'lucide-react'

export default function RoleSelectionPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  const supabase = getSupabaseClient()

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

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-500">Wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Header with Back Button */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <button
          onClick={() => router.push('/')}
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="font-semibold text-lg">Registrieren</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {/* Header */}
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Wählen Sie Ihre Rolle</h2>
          <p className="text-slate-500 text-sm">Registrieren Sie sich als Werkstatt oder Versicherung</p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4 mt-4">
          {/* Werkstatt */}
          <Link
            href="/register/werkstatt"
            className="block bg-white rounded-2xl border border-slate-200 p-5 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900 mb-1">Für Werkstätten</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Aufträge empfangen, Daten prüfen und Provisionen verwalten.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 mt-1" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                Multi-Standort
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                Live-Chat
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                Provisions-Tracking
              </span>
            </div>
          </Link>

          {/* Versicherung */}
          <Link
            href="/register/versicherung"
            className="block bg-white rounded-2xl border border-slate-200 p-5 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900 mb-1">Für Versicherungen</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Schäden erfassen, Werkstätten zuweisen und Status verfolgen.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 mt-1" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                Schadens-Wizard
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                Echtzeit-Status
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                Foto-Upload
              </span>
            </div>
          </Link>
        </div>

        {/* Already have account */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-slate-600 mb-4">Sie haben bereits ein Konto?</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
          >
            Zum Login
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
