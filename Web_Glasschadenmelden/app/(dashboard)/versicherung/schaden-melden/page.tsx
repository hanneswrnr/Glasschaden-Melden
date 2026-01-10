'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, FileText, ChevronDown, Send } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DEUTSCHE_VERSICHERUNGEN } from '@/lib/constants/versicherungen'
import { DAMAGE_TYPE_LABELS, type DamageType } from '@/lib/supabase/database.types'
import { CustomSelect } from '@/components/shared/CustomSelect'
import { CustomDatePicker } from '@/components/shared/CustomDatePicker'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'

interface WerkstattStandort {
  id: string
  name: string
  adresse: string
  werkstatt_id: string
}

interface FormData {
  // Pflichtfelder
  kunde_vorname: string
  kunde_nachname: string
  kunde_telefon: string
  werkstatt_standort_id: string
  vers_name: string
  schadensart: DamageType | ''
  schaden_datum: string
  // Optionale Felder
  vers_nr: string
  selbstbeteiligung: string
  kennzeichen: string
  vin: string
  beschreibung: string
}

// Verwende existierende ENUM-Werte bis Migration ausgeführt wird
const SCHADENSARTEN: { value: DamageType; label: string }[] = [
  { value: 'steinschlag', label: 'Frontscheibe Steinschlagreparatur' },
  { value: 'austausch', label: 'Frontscheibe Austausch' },
  { value: 'riss', label: 'Seitenscheibe Austausch' },
  { value: 'sonstiges', label: 'Heckscheibe Austausch' },
]

export default function SchadenMeldenPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { showSuccess, AnimationComponent } = useSuccessAnimation()

  const [isLoading, setIsLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [werkstaetten, setWerkstaetten] = useState<WerkstattStandort[]>([])
  const [versicherungId, setVersicherungId] = useState<string | null>(null)
  const [vermittlerFirma, setVermittlerFirma] = useState<string>('')

  const [formData, setFormData] = useState<FormData>({
    kunde_vorname: '',
    kunde_nachname: '',
    kunde_telefon: '',
    werkstatt_standort_id: '',
    vers_name: '',
    schadensart: '',
    schaden_datum: new Date().toISOString().split('T')[0],
    vers_nr: '',
    selbstbeteiligung: '',
    kennzeichen: '',
    vin: '',
    beschreibung: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Lade Versicherungs-ID und Firma
    const { data: versicherung } = await supabase
      .from('versicherungen')
      .select('id, firma')
      .eq('user_id', user.id)
      .single()

    if (versicherung) {
      setVersicherungId(versicherung.id)
      setVermittlerFirma(versicherung.firma)
    }

    // Lade alle Werkstatt-Standorte
    const { data: standorte } = await supabase
      .from('werkstatt_standorte')
      .select('id, name, adresse, werkstatt_id')
      .order('name')

    if (standorte) {
      setWerkstaetten(standorte)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!versicherungId) {
      toast.error('Versicherungs-Konto nicht gefunden')
      return
    }

    // Validierung
    if (!formData.kunde_vorname || !formData.kunde_nachname) {
      toast.error('Bitte Vor- und Nachname eingeben')
      return
    }
    if (!formData.kunde_telefon) {
      toast.error('Bitte Telefonnummer eingeben')
      return
    }
    if (!formData.werkstatt_standort_id) {
      toast.error('Bitte Werkstatt auswählen')
      return
    }
    if (!formData.vers_name) {
      toast.error('Bitte Versicherung auswählen')
      return
    }
    if (!formData.schadensart) {
      toast.error('Bitte Schadensart auswählen')
      return
    }
    if (!formData.schaden_datum) {
      toast.error('Bitte Schadensdatum angeben')
      return
    }

    setIsLoading(true)

    try {
      // Build insert data
      // Note: Most fields have NOT NULL constraints, so we use empty strings as defaults
      // Exception: VIN has a CHECK constraint that rejects empty strings, so only include if valid
      // Finde den Namen der ausgewählten Werkstatt
      const selectedWerkstatt = werkstaetten.find(w => w.id === formData.werkstatt_standort_id)

      const insertData: Record<string, unknown> = {
        versicherung_id: versicherungId,
        werkstatt_standort_id: formData.werkstatt_standort_id,
        werkstatt_name: selectedWerkstatt?.name || '',
        vermittler_firma: vermittlerFirma,
        kunde_vorname: formData.kunde_vorname,
        kunde_nachname: formData.kunde_nachname,
        kunde_telefon: formData.kunde_telefon,
        vers_name: formData.vers_name,
        vers_nr: formData.vers_nr || '',
        selbstbeteiligung: formData.selbstbeteiligung ? parseFloat(formData.selbstbeteiligung) : 0,
        schadensart: formData.schadensart as DamageType,
        schaden_datum: formData.schaden_datum,
        kennzeichen: formData.kennzeichen || '',
        fahrzeug_marke: '',
        fahrzeug_modell: '',
        beschreibung: formData.beschreibung || '',
        status: 'neu',
        is_deleted: false,
      }

      // VIN has a CHECK constraint - only include if it's a valid 17-character VIN
      if (formData.vin && formData.vin.length === 17) {
        insertData.vin = formData.vin
      }

      const { error } = await supabase.from('claims').insert(insertData)

      if (error) {
        console.error('Error creating claim:', error)
        toast.error(`Fehler: ${error.message}`)
        return
      }

      showSuccess('Schaden erfolgreich gemeldet!', 'green')
      setTimeout(() => {
        router.push('/versicherung')
      }, 1500)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-gradient-hero">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link
          href="/versicherung"
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900">Schaden melden</h1>
          <p className="text-xs text-slate-500">Neuen Glasschaden erfassen</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:navbar sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/versicherung" className="flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary-600))] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Zurück zum Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 pb-8 md:max-w-2xl md:mx-auto md:px-6 md:py-8">
        <div className="bg-white rounded-xl border border-slate-200 md:card-elevated p-5 md:p-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="hidden md:flex icon-box icon-box-lg icon-box-primary mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl md:heading-2 font-bold mb-1 md:mb-2">Glasschaden melden</h1>
            <p className="text-sm md:text-base text-muted">Erfassen Sie einen neuen Glasschaden</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            {/* Pflichtfelder */}
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[hsl(var(--primary-500))] text-white text-xs md:text-sm flex items-center justify-center">1</span>
                Kundendaten
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="input-label text-sm">Vorname *</label>
                  <input
                    type="text"
                    required
                    value={formData.kunde_vorname}
                    onChange={(e) => setFormData({ ...formData, kunde_vorname: e.target.value })}
                    className="input h-11 md:h-12"
                    placeholder="Max"
                  />
                </div>
                <div>
                  <label className="input-label text-sm">Nachname *</label>
                  <input
                    type="text"
                    required
                    value={formData.kunde_nachname}
                    onChange={(e) => setFormData({ ...formData, kunde_nachname: e.target.value })}
                    className="input h-11 md:h-12"
                    placeholder="Mustermann"
                  />
                </div>
              </div>

              <div>
                <label className="input-label text-sm">Telefonnummer *</label>
                <input
                  type="tel"
                  required
                  value={formData.kunde_telefon}
                  onChange={(e) => setFormData({ ...formData, kunde_telefon: e.target.value })}
                  className="input h-11 md:h-12"
                  placeholder="+49 123 456789"
                />
              </div>
            </div>

            {/* Werkstatt & Versicherung */}
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[hsl(var(--primary-500))] text-white text-xs md:text-sm flex items-center justify-center">2</span>
                Zuweisung
              </h2>

              <div>
                <label className="input-label text-sm">Werkstatt *</label>
                <CustomSelect
                  options={werkstaetten.map((w) => ({ value: w.id, label: `${w.name} - ${w.adresse}` }))}
                  value={formData.werkstatt_standort_id}
                  onChange={(value) => setFormData({ ...formData, werkstatt_standort_id: value })}
                  placeholder="Werkstatt auswählen..."
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
              </div>

              <div>
                <label className="input-label text-sm">Versicherung des Kunden *</label>
                <CustomSelect
                  options={DEUTSCHE_VERSICHERUNGEN.map((v) => ({ value: v.name, label: v.name }))}
                  value={formData.vers_name}
                  onChange={(value) => setFormData({ ...formData, vers_name: value })}
                  placeholder="Versicherung auswählen..."
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Schadensdetails */}
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[hsl(var(--primary-500))] text-white text-xs md:text-sm flex items-center justify-center">3</span>
                Schadensdetails
              </h2>

              <div>
                <label className="input-label text-sm">Schadensart *</label>
                <CustomSelect
                  options={SCHADENSARTEN.map((s) => ({ value: s.value, label: s.label }))}
                  value={formData.schadensart}
                  onChange={(value) => setFormData({ ...formData, schadensart: value as DamageType })}
                  placeholder="Schadensart auswählen..."
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  }
                />
              </div>

              <div>
                <label className="input-label text-sm">Schadensdatum *</label>
                <CustomDatePicker
                  value={formData.schaden_datum}
                  onChange={(value) => setFormData({ ...formData, schaden_datum: value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Optionale Details (Collapsible) */}
            <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-3 md:px-4 py-3 flex items-center justify-between bg-[hsl(var(--muted))]/50 active:bg-[hsl(var(--muted))] md:hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <span className="font-medium text-sm md:text-base flex items-center gap-2">
                  <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Weitere Details (optional)
                </span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                />
              </button>

              {showDetails && (
                <div className="p-3 md:p-4 space-y-3 md:space-y-4 animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="input-label text-sm">Versicherungsnummer</label>
                      <input
                        type="text"
                        value={formData.vers_nr}
                        onChange={(e) => setFormData({ ...formData, vers_nr: e.target.value })}
                        className="input h-11 md:h-12"
                        placeholder="VS-123456"
                      />
                    </div>
                    <div>
                      <label className="input-label text-sm">Selbstbeteiligung (EUR)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.selbstbeteiligung}
                        onChange={(e) => setFormData({ ...formData, selbstbeteiligung: e.target.value })}
                        className="input h-11 md:h-12"
                        placeholder="150.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="input-label text-sm">Kennzeichen</label>
                      <input
                        type="text"
                        value={formData.kennzeichen}
                        onChange={(e) => setFormData({ ...formData, kennzeichen: e.target.value.toUpperCase() })}
                        className="input h-11 md:h-12"
                        placeholder="M-AB 1234"
                      />
                    </div>
                    <div>
                      <label className="input-label text-sm">VIN / Fahrgestellnummer</label>
                      <input
                        type="text"
                        maxLength={17}
                        value={formData.vin}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase().replace(/[IOQ]/g, '') })}
                        className="input h-11 md:h-12"
                        placeholder="WVWZZZ3CZWE123456"
                      />
                      <p className="text-xs text-muted mt-1">17 Zeichen, ohne I, O, Q</p>
                    </div>
                  </div>

                  <div>
                    <label className="input-label text-sm">Beschreibung / Anmerkungen</label>
                    <textarea
                      value={formData.beschreibung}
                      onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                      className="input min-h-[80px] md:min-h-[100px]"
                      placeholder="Weitere Informationen zum Schaden..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 md:py-4 text-base md:text-lg active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wird gemeldet...
                </span>
              ) : (
                <>
                  Schaden melden
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
    </>
  )
}
