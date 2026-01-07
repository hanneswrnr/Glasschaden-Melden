'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PublicHeader } from '@/components/shared/PublicHeader'
import { PublicFooter } from '@/components/shared/PublicFooter'
import { getSupabaseClient } from '@/lib/supabase/client'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'Was ist GlasschadenMelden?',
    answer: 'GlasschadenMelden ist eine digitale Plattform, die den Prozess der Glasschadenmeldung zwischen Versicherungen und Werkstätten vereinfacht und beschleunigt. Unsere Lösung ermöglicht eine nahtlose Kommunikation und effiziente Abwicklung aller Glasschäden.'
  },
  {
    question: 'Wie funktioniert die Schadensmeldung?',
    answer: 'Als Versicherung erfassen Sie den Schaden über unseren intuitiven Wizard, laden Fotos hoch und weisen eine Partner-Werkstatt zu. Die Werkstatt erhält die Meldung sofort und kann mit der Bearbeitung beginnen. Der gesamte Prozess wird transparent dokumentiert.'
  },
  {
    question: 'Sind meine Daten sicher?',
    answer: 'Ja! Wir verwenden modernste Verschlüsselungstechnologien und speichern Ihre Daten DSGVO-konform in deutschen Rechenzentren. Alle Übertragungen sind SSL-verschlüsselt und wir führen regelmäßige Sicherheitsaudits durch.'
  },
  {
    question: 'Kann ich mehrere Standorte verwalten?',
    answer: 'Ja, als Werkstatt können Sie beliebig viele Standorte unter einem Account verwalten. Aufträge können individuell den jeweiligen Standorten zugewiesen werden, und Sie behalten stets den Überblick über alle Ihre Niederlassungen.'
  },
  {
    question: 'Gibt es eine Gebühr für die Nutzung?',
    answer: 'Die Registrierung ist kostenlos. Details zu unserem transparenten Provisionsmodell erfahren Sie nach der Registrierung in Ihrem persönlichen Dashboard. Es gibt keine versteckten Kosten.'
  },
  {
    question: 'Wie schnell werden Schäden bearbeitet?',
    answer: 'Durch unsere digitale Plattform werden Schäden in der Regel innerhalb weniger Stunden an die Werkstatt übermittelt. Die tatsächliche Bearbeitungszeit hängt von der Verfügbarkeit der Werkstatt und den erforderlichen Ersatzteilen ab.'
  }
]

export default function InfoPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
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
      if (profile?.role) {
        setUserRole(profile.role)
      }
    }
  }

  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    switch (userRole) {
      case 'admin':
        return '/admin'
      case 'versicherung':
        return '/versicherung'
      case 'werkstatt':
        return '/werkstatt'
      default:
        return '/role-selection'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <PublicHeader userRole={userRole} />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary-50))] border border-[hsl(var(--primary-200))] mb-6">
            <svg className="w-4 h-4 text-[hsl(var(--primary-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-[hsl(var(--primary-700))]">Über uns</span>
          </div>

          <h1 className="heading-1 text-4xl md:text-5xl mb-6">
            Die moderne Lösung für
            <br />
            <span className="text-gradient-animated">Glasschaden-Management</span>
          </h1>

          <p className="text-xl text-muted max-w-3xl mx-auto mb-10">
            GlasschadenMelden verbindet Versicherungen und Werkstätten auf einer innovativen Plattform.
            Erleben Sie schnelle Schadensmeldung, transparente Kommunikation und effiziente Abwicklung.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="card card-shimmer p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-4xl font-bold text-[hsl(var(--primary-600))] mb-2">100%</div>
            <div className="text-muted font-medium">Digital</div>
          </div>
          <div className="card card-shimmer p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="text-4xl font-bold text-[hsl(var(--success))] mb-2">24/7</div>
            <div className="text-muted font-medium">Verfügbar</div>
          </div>
          <div className="card card-shimmer p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-4xl font-bold text-[hsl(var(--warning))] mb-2">DSGVO</div>
            <div className="text-muted font-medium">Konform</div>
          </div>
          <div className="card card-shimmer p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="text-4xl font-bold text-[hsl(var(--primary-500))] mb-2">SSL</div>
            <div className="text-muted font-medium">Verschlüsselt</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="heading-2 text-center mb-12">Hauptfunktionen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card card-shimmer p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="icon-box icon-box-primary mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="heading-3 mb-3">Digitale Schadenserfassung</h3>
            <p className="text-muted leading-relaxed">
              Erfassen Sie Glasschäden schnell und vollständig digital. Unser intuitiver Wizard führt Sie durch alle notwendigen Schritte - inklusive Foto-Upload und automatischer Validierung.
            </p>
          </div>

          <div className="card card-shimmer p-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="icon-box icon-box-primary mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="heading-3 mb-3">Integrierter Live-Chat</h3>
            <p className="text-muted leading-relaxed">
              Kommunizieren Sie direkt mit Werkstätten oder Versicherungen über unseren sicheren, integrierten Chat. Alle Nachrichten werden automatisch dem jeweiligen Schadensfall zugeordnet.
            </p>
          </div>

          <div className="card card-shimmer p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="icon-box icon-box-primary mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="heading-3 mb-3">Echtzeit-Statusverfolgung</h3>
            <p className="text-muted leading-relaxed">
              Verfolgen Sie den Bearbeitungsstand jeder Schadensmeldung in Echtzeit. Automatische Benachrichtigungen halten Sie über jeden Fortschritt auf dem Laufenden.
            </p>
          </div>

          <div className="card card-shimmer p-8 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="icon-box icon-box-primary mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="heading-3 mb-3">Sichere Datenspeicherung</h3>
            <p className="text-muted leading-relaxed">
              Ihre Daten werden verschlüsselt und DSGVO-konform in deutschen Rechenzentren gespeichert. Modernste Sicherheitsstandards schützen Ihre sensiblen Informationen.
            </p>
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="heading-2 text-center mb-12">Für wen ist die Plattform?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Versicherungen */}
          <div className="card card-shimmer p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--primary-100))] flex items-center justify-center">
                <svg className="w-8 h-8 text-[hsl(var(--primary-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              <div>
                <h3 className="heading-3">Versicherungen</h3>
                <p className="text-muted text-sm">Auftraggeber</p>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Schäden digital erfassen und dokumentieren</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Partner-Werkstätten einfach zuweisen</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Bearbeitungsstatus in Echtzeit verfolgen</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Direkte Kommunikation mit Werkstätten</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Übersichtliche Provisionsabrechnung</span>
              </li>
            </ul>
          </div>

          {/* Werkstätten */}
          <div className="card card-shimmer p-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="heading-3">Werkstätten</h3>
                <p className="text-muted text-sm">Auftragnehmer</p>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Aufträge digital empfangen und verwalten</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Kundendaten prüfen und korrigieren</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Mehrere Standorte zentral verwalten</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Provisionen transparent einsehen</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[hsl(var(--success))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-muted">Direkte Rückfragen an Versicherungen</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="heading-2 text-center mb-12">So funktioniert&apos;s</h2>
        <div className="card card-shimmer p-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <StepItem
              number={1}
              title="Registrieren"
              description="Erstellen Sie ein Konto als Versicherung oder Werkstatt"
            />
            <StepItem
              number={2}
              title="Schaden erfassen"
              description="Versicherung erfasst den Schaden mit allen Details"
            />
            <StepItem
              number={3}
              title="Werkstatt zuweisen"
              description="Wählen Sie eine Partner-Werkstatt für die Reparatur"
            />
            <StepItem
              number={4}
              title="Bearbeitung"
              description="Werkstatt prüft, korrigiert und bearbeitet den Auftrag"
            />
            <StepItem
              number={5}
              title="Abschluss"
              description="Schaden wird erledigt und dokumentiert"
              isLast
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="heading-2 text-center mb-12">Häufige Fragen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="card card-shimmer overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-[hsl(var(--muted))]/50 transition-colors"
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-muted flex-shrink-0 transition-transform ${openFAQ === index ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-6">
                  <p className="text-muted leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Technology */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="heading-2 text-center mb-12">Technologie</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="card card-shimmer p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="icon-box icon-box-primary mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-1">Schnell & Modern</h4>
            <p className="text-sm text-muted">Next.js Framework</p>
          </div>
          <div className="card card-shimmer p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="icon-box icon-box-primary mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-1">SSL-Verschlüsselt</h4>
            <p className="text-sm text-muted">Ende-zu-Ende Sicherheit</p>
          </div>
          <div className="card card-shimmer p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="icon-box icon-box-primary mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-1">Cloud-basiert</h4>
            <p className="text-sm text-muted">Supabase Backend</p>
          </div>
          <div className="card card-shimmer p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="icon-box icon-box-primary mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-1">Responsive</h4>
            <p className="text-sm text-muted">Alle Geräte</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden p-12 text-center animate-fade-in-up bg-gradient-to-br from-[hsl(var(--primary-500))] via-[hsl(var(--primary-600))] to-[hsl(var(--primary-700))] text-white rounded-[var(--radius-2xl)] shadow-2xl">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="icon-box icon-box-lg mx-auto mb-6 bg-white/20 backdrop-blur-sm text-white">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Noch Fragen?</h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Kontaktieren Sie uns für weitere Informationen oder starten Sie direkt mit der Registrierung.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {userRole ? (
                <>
                  <Link href={getDashboardUrl()} className="inline-flex items-center gap-2 bg-white text-[hsl(var(--primary-600))] px-8 py-4 rounded-xl font-semibold hover:bg-white/90 hover:scale-105 transition-all shadow-lg shadow-black/10">
                    Zum Dashboard
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <a href="mailto:info@glasschaden-melden.de" className="inline-flex items-center gap-2 bg-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors">
                    Kontakt aufnehmen
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                </>
              ) : (
                <>
                  <Link href="/role-selection" className="inline-flex items-center gap-2 bg-white text-[hsl(var(--primary-600))] px-8 py-4 rounded-xl font-semibold hover:bg-white/90 hover:scale-105 transition-all shadow-lg shadow-black/10">
                    Jetzt registrieren
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <a href="mailto:info@glasschaden-melden.de" className="inline-flex items-center gap-2 bg-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors">
                    Kontakt aufnehmen
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function StepItem({
  number,
  title,
  description,
  isLast = false
}: {
  number: number
  title: string
  description: string
  isLast?: boolean
}) {
  return (
    <div className="flex flex-col items-center text-center relative">
      {/* Connector Line */}
      {!isLast && (
        <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-[hsl(var(--primary-200))]" />
      )}

      <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary-600))] text-white flex items-center justify-center font-bold text-lg mb-4 relative z-10">
        {number}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted">{description}</p>
    </div>
  )
}
