'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function RegisterWerkstattPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Account
    email: '',
    password: '',
    confirmPassword: '',
    // Standort
    standortName: '',
    adresse: '',
    ansprechpartner: '',
    telefon: '',
  })

  const supabase = getSupabaseClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen haben')
      return
    }

    setIsLoading(true)

    try {
      // 1. Registriere User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        toast.error(`Registrierung fehlgeschlagen: ${authError.message}`)
        return
      }

      if (!authData.user) {
        toast.error('Registrierung fehlgeschlagen')
        return
      }

      // 2. Update Profil mit Rolle und Display-Daten
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'werkstatt',
          display_name: formData.ansprechpartner,
          company_name: formData.standortName,
          phone: formData.telefon,
          address: formData.adresse,
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }

      // 3. Erstelle Werkstatt
      const { data: werkstattData, error: werkstattError } = await supabase
        .from('werkstaetten')
        .insert({
          user_id: authData.user.id,
        })
        .select()
        .single()

      if (werkstattError) {
        toast.error(`Fehler beim Erstellen der Werkstatt: ${werkstattError.message}`)
        return
      }

      // 4. Erstelle ersten Standort
      const { error: standortError } = await supabase
        .from('werkstatt_standorte')
        .insert({
          werkstatt_id: werkstattData.id,
          name: formData.standortName,
          adresse: formData.adresse,
          ansprechpartner: formData.ansprechpartner,
          telefon: formData.telefon,
          is_primary: true,
        })

      if (standortError) {
        toast.error(`Fehler beim Erstellen des Standorts: ${standortError.message}`)
        return
      }

      toast.success('Registrierung erfolgreich!')
      router.push('/werkstatt')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  function nextStep() {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        toast.error('Bitte alle Felder ausfüllen')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwörter stimmen nicht überein')
        return
      }
      if (formData.password.length < 8) {
        toast.error('Passwort muss mindestens 8 Zeichen haben')
        return
      }
    }
    setStep(step + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="navbar">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="logo-link">
            <div className="logo-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="logo-text">Glasschaden<span className="logo-text-accent">Melden</span></span>
          </Link>
          <Link href="/login" className="btn-ghost text-sm">
            Bereits registriert? Anmelden
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="card-elevated p-8 animate-fade-in-up">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      s === step
                        ? 'bg-[hsl(var(--primary-500))] text-white shadow-lg'
                        : s < step
                        ? 'bg-[hsl(var(--success))] text-white'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {s < step ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  {s < 2 && (
                    <div className={`w-16 h-1 mx-2 rounded transition-all ${s < step ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--muted))]'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="icon-box icon-box-lg icon-box-primary mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="heading-2 mb-2">Als Werkstatt registrieren</h1>
              <p className="text-muted">
                {step === 1 && 'Erstellen Sie Ihr Konto'}
                {step === 2 && 'Standort-Informationen'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Account */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="input-label">E-Mail</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="info@werkstatt.de"
                    />
                  </div>
                  <div>
                    <label className="input-label">Passwort</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      placeholder="Mindestens 8 Zeichen"
                    />
                  </div>
                  <div>
                    <label className="input-label">Passwort bestätigen</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input"
                      placeholder="Passwort wiederholen"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Standort */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="input-label">Standortname *</label>
                    <input
                      type="text"
                      required
                      value={formData.standortName}
                      onChange={(e) => setFormData({ ...formData, standortName: e.target.value })}
                      className="input"
                      placeholder="Hauptstandort / Filiale Berlin"
                    />
                  </div>
                  <div>
                    <label className="input-label">Adresse *</label>
                    <input
                      type="text"
                      required
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      className="input"
                      placeholder="Werkstattstraße 1, 12345 Musterstadt"
                    />
                  </div>
                  <div>
                    <label className="input-label">Ansprechpartner *</label>
                    <input
                      type="text"
                      required
                      value={formData.ansprechpartner}
                      onChange={(e) => setFormData({ ...formData, ansprechpartner: e.target.value })}
                      className="input"
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div>
                    <label className="input-label">Telefon *</label>
                    <input
                      type="tel"
                      required
                      value={formData.telefon}
                      onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                      className="input"
                      placeholder="+49 123 456789"
                    />
                  </div>
                  <div className="p-4 bg-[hsl(var(--primary-50))] rounded-xl">
                    <p className="text-sm text-[hsl(var(--primary-700))]">
                      Sie können später weitere Standorte hinzufügen.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="btn-secondary flex-1"
                  >
                    Zurück
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn-primary flex-1"
                  >
                    Weiter
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="spinner-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        Wird registriert...
                      </span>
                    ) : (
                      'Registrierung abschließen'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
