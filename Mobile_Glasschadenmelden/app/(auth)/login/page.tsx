'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft, Lock, Mail, ChevronRight, Building2, Wrench } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const supabase = getSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        toast.error(`Login fehlgeschlagen: ${error.message}`)
        return
      }

      if (!data.user) {
        toast.error('Login fehlgeschlagen')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const userRole = (profile as { role?: string } | null)?.role

      if (userRole === 'admin') {
        router.push('/admin')
      } else if (userRole === 'versicherung') {
        router.push('/versicherung')
      } else if (userRole === 'werkstatt') {
        router.push('/werkstatt')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
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
        <h1 className="font-semibold text-lg">Anmelden</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {/* Logo & Welcome */}
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Willkommen zurück</h2>
          <p className="text-slate-500">Melden Sie sich an, um fortzufahren</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Mail className="w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                placeholder="E-Mail-Adresse"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Lock className="w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
                placeholder="Passwort"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Wird angemeldet...
              </span>
            ) : (
              <>
                Anmelden
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-500">Noch kein Konto?</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Register Options */}
        <div className="space-y-3">
          <Link
            href="/register/versicherung"
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Als Versicherung</h3>
              <p className="text-sm text-slate-500">Konto erstellen</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>

          <Link
            href="/register/werkstatt"
            className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Als Werkstatt</h3>
              <p className="text-sm text-slate-500">Konto erstellen</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
        </div>

      </main>
    </div>
  )
}
