'use client'

import { useState } from 'react'
import {
  Shield,
  Clock,
  Award,
  Users,
  Building2,
  Wrench,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronRight,
  Zap,
  Lock,
  Globe,
  Smartphone,
  CheckCircle2
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'Was ist GlasschadenMelden?',
    answer: 'GlasschadenMelden ist eine digitale Plattform, die den Prozess der Glasschadenmeldung zwischen Versicherungen und Werkstätten vereinfacht und beschleunigt.'
  },
  {
    question: 'Wie funktioniert die Schadensmeldung?',
    answer: 'Als Versicherung erfassen Sie den Schaden über unseren intuitiven Wizard, laden Fotos hoch und weisen eine Werkstatt zu. Die Werkstatt erhält die Meldung sofort und kann mit der Bearbeitung beginnen.'
  },
  {
    question: 'Ist meine Daten sicher?',
    answer: 'Ja! Wir verwenden modernste Verschlüsselungstechnologien und speichern Ihre Daten DSGVO-konform in deutschen Rechenzentren.'
  },
  {
    question: 'Kann ich mehrere Standorte verwalten?',
    answer: 'Ja, als Werkstatt können Sie beliebig viele Standorte unter einem Account verwalten und Aufträge entsprechend zuweisen.'
  },
  {
    question: 'Gibt es eine Gebühr für die Nutzung?',
    answer: 'Die Registrierung ist kostenlos. Details zu unserem Provisionsmodell erfahren Sie nach der Registrierung in Ihrem Dashboard.'
  }
]

export default function InfoPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
        <h1 className="font-bold text-lg text-center">Über GlasschadenMelden</h1>
      </header>

      <main className="p-4 pb-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white mb-6 shadow-xl">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-slow" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float-slow-reverse" />
          </div>

          <div className="relative text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Die moderne Lösung</h2>
            <p className="text-indigo-100 text-sm leading-relaxed">
              für Glasschaden-Management zwischen Versicherungen und Werkstätten
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
            <div className="text-2xl font-bold text-indigo-600">100%</div>
            <div className="text-xs text-slate-500 mt-1">Digital</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">24/7</div>
            <div className="text-xs text-slate-500 mt-1">Verfügbar</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
            <div className="text-2xl font-bold text-amber-600">DSGVO</div>
            <div className="text-xs text-slate-500 mt-1">Konform</div>
          </div>
        </div>

        {/* Features */}
        <h3 className="font-semibold text-slate-900 mb-3 px-1">Hauptfunktionen</h3>
        <div className="space-y-3 mb-6">
          <FeatureCard
            icon={<FileText className="w-5 h-5" />}
            title="Digitale Schadenserfassung"
            description="Erfassen Sie Glasschäden schnell und vollständig digital mit Foto-Upload"
            color="indigo"
          />
          <FeatureCard
            icon={<MessageSquare className="w-5 h-5" />}
            title="Live-Chat"
            description="Kommunizieren Sie direkt mit Werkstätten über unseren integrierten Chat"
            color="blue"
          />
          <FeatureCard
            icon={<Clock className="w-5 h-5" />}
            title="Echtzeit-Status"
            description="Verfolgen Sie den Bearbeitungsstand jeder Schadensmeldung live"
            color="amber"
          />
          <FeatureCard
            icon={<Lock className="w-5 h-5" />}
            title="Sichere Datenspeicherung"
            description="Ihre Daten werden verschlüsselt und DSGVO-konform gespeichert"
            color="emerald"
          />
        </div>

        {/* For whom */}
        <h3 className="font-semibold text-slate-900 mb-3 px-1">Für wen ist die App?</h3>
        <div className="space-y-3 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Versicherungen</h4>
                <p className="text-xs text-slate-500">Auftraggeber</p>
              </div>
            </div>
            <ul className="space-y-2">
              <ListItem>Schäden digital erfassen und dokumentieren</ListItem>
              <ListItem>Partner-Werkstätten zuweisen</ListItem>
              <ListItem>Bearbeitungsstatus in Echtzeit verfolgen</ListItem>
              <ListItem>Direkte Kommunikation mit Werkstätten</ListItem>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Werkstätten</h4>
                <p className="text-xs text-slate-500">Auftragnehmer</p>
              </div>
            </div>
            <ul className="space-y-2">
              <ListItem>Aufträge digital empfangen</ListItem>
              <ListItem>Kundendaten prüfen und korrigieren</ListItem>
              <ListItem>Mehrere Standorte verwalten</ListItem>
              <ListItem>Provisionen transparent einsehen</ListItem>
            </ul>
          </div>
        </div>

        {/* How it works */}
        <h3 className="font-semibold text-slate-900 mb-3 px-1">So funktioniert&apos;s</h3>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
          <div className="space-y-4">
            <StepItem number={1} title="Registrieren" description="Erstellen Sie ein Konto als Versicherung oder Werkstatt" />
            <StepItem number={2} title="Schaden erfassen" description="Versicherung erfasst den Schaden mit allen Details" />
            <StepItem number={3} title="Werkstatt zuweisen" description="Wählen Sie eine Partner-Werkstatt für die Reparatur" />
            <StepItem number={4} title="Bearbeitung" description="Werkstatt prüft, korrigiert und bearbeitet den Auftrag" />
            <StepItem number={5} title="Abschluss" description="Schaden wird erledigt und dokumentiert" isLast />
          </div>
        </div>

        {/* FAQ */}
        <h3 className="font-semibold text-slate-900 mb-3 px-1">Häufige Fragen</h3>
        <div className="space-y-2 mb-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <span className="font-medium text-slate-900 text-sm">{faq.question}</span>
                {openFAQ === index ? (
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <h3 className="font-semibold text-slate-900 mb-3 px-1">Technologie</h3>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
          <div className="grid grid-cols-2 gap-4">
            <TechItem icon={<Zap className="w-4 h-4" />} label="Schnell & Modern" />
            <TechItem icon={<Lock className="w-4 h-4" />} label="SSL-Verschlüsselt" />
            <TechItem icon={<Globe className="w-4 h-4" />} label="Cloud-basiert" />
            <TechItem icon={<Smartphone className="w-4 h-4" />} label="Mobile-First" />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white text-center">
          <h3 className="font-semibold mb-2">Noch Fragen?</h3>
          <p className="text-slate-300 text-sm mb-4">
            Kontaktieren Sie uns für weitere Informationen
          </p>
          <a
            href="mailto:info@glasschaden-melden.de"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl font-medium text-sm"
          >
            Kontakt aufnehmen
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Version 1.0.0 • Made in Germany
        </p>
      </main>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  color
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: 'indigo' | 'blue' | 'amber' | 'emerald'
}) {
  const colors = {
    indigo: 'bg-indigo-100 text-indigo-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <div className="bg-white rounded-2xl p-4 flex items-start gap-4 border border-slate-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-600">
      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      {children}
    </li>
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
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
          {number}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-indigo-200 mt-2" />}
      </div>
      <div className="pb-4">
        <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function TechItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
        {icon}
      </div>
      <span>{label}</span>
    </div>
  )
}
