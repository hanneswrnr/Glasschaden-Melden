'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PublicHeader } from '@/components/shared/PublicHeader'
import { PublicFooter } from '@/components/shared/PublicFooter'

export default function LandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  // Check if user explicitly wants to stay on homepage
  const stayOnHome = searchParams.get('home') === 'true'

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

      // Store the role for showing dashboard link
      if (profile?.role) {
        setUserRole(profile.role)
      }

      // Only redirect if user didn't explicitly navigate to home
      if (!stayOnHome) {
        if (profile?.role === 'admin') {
          router.push('/admin')
          return
        } else if (profile?.role === 'versicherung') {
          router.push('/versicherung')
          return
        } else if (profile?.role === 'werkstatt') {
          router.push('/werkstatt')
          return
        }
      }
    }

    setIsChecking(false)
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <PublicHeader userRole={userRole} />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary-50))] border border-[hsl(var(--primary-200))] mb-8">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse-soft" />
            <span className="text-sm font-medium text-[hsl(var(--primary-700))]">Jetzt verfügbar</span>
          </div>

          <h1 className="heading-1 text-5xl md:text-6xl mb-6">
            Glasschaden-Management
            <br />
            <span className="text-gradient-animated">einfach & professionell</span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
            Die moderne Plattform für Versicherungen und Werkstätten.
            Schnelle Schadensmeldung, reibungslose Abwicklung – für alle Beteiligten.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 md:mb-16 px-4 sm:px-0">
            <Link href="/role-selection" className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 py-4">
              Jetzt starten
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link href="/info" className="btn-secondary w-full sm:w-auto text-base sm:text-lg px-8 py-4">
              Mehr erfahren
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="feature-card card-shimmer animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="heading-3 mb-3">Sicher & Zuverlässig</h3>
            <p className="text-muted">
              Ihre Daten sind bei uns sicher geschützt. Modernste Verschlüsselung und strenge Datenschutzrichtlinien.
            </p>
          </div>

          <div className="feature-card card-shimmer animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="heading-3 mb-3">Schnell & Effizient</h3>
            <p className="text-muted">
              Schadensmeldung in wenigen Minuten. Keine komplizierten Formulare, keine langen Wartezeiten.
            </p>
          </div>

          <div className="feature-card card-shimmer animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="feature-icon">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="heading-3 mb-3">Professionell</h3>
            <p className="text-muted">
              Erfüllt höchste Qualitätsstandards. Entwickelt für professionelle Ansprüche.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="card card-shimmer p-12 text-center animate-fade-in-up">
          <div className="icon-box icon-box-lg icon-box-primary mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="heading-1 mb-4">Bereit loszulegen?</h2>
          <p className="text-lg text-muted max-w-xl mx-auto mb-8">
            Registrieren Sie sich jetzt als Werkstatt oder Versicherung und starten Sie mit der digitalen Schadensmeldung.
          </p>
          <Link href="/role-selection" className="btn-primary text-lg px-10 py-4">
            Jetzt registrieren
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
