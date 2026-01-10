'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DEUTSCHE_VERSICHERUNGEN } from '@/lib/constants/versicherungen'
import { DAMAGE_TYPE_LABELS, type DamageType } from '@/lib/supabase/database.types'
import { CustomSelect } from '@/components/shared/CustomSelect'
import { CustomDatePicker } from '@/components/shared/CustomDatePicker'
import { ArrowLeft, User, Phone, Building2, Shield, Calendar, ChevronDown, ChevronUp, Car, FileText, Send } from 'lucide-react'
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Header with Back Button */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link
          href="/versicherung"
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="font-semibold text-lg">Schaden melden</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Kundendaten */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-semibold">1</div>
                <span className="font-semibold text-purple-900">Kundendaten</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Vorname *</label>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                    <User className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.kunde_vorname}
                      onChange={(e) => setFormData({ ...formData, kunde_vorname: e.target.value })}
                      className="flex-1 bg-transparent outline-none text-slate-900 text-sm placeholder:text-slate-400"
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Nachname *</label>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                    <input
                      type="text"
                      required
                      value={formData.kunde_nachname}
                      onChange={(e) => setFormData({ ...formData, kunde_nachname: e.target.value })}
                      className="flex-1 bg-transparent outline-none text-slate-900 text-sm placeholder:text-slate-400"
                      placeholder="Mustermann"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Telefonnummer *</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formData.kunde_telefon}
                    onChange={(e) => setFormData({ ...formData, kunde_telefon: e.target.value })}
                    className="flex-1 bg-transparent outline-none text-slate-900 text-sm placeholder:text-slate-400"
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Zuweisung */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-semibold">2</div>
                <span className="font-semibold text-purple-900">Zuweisung</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Werkstatt *</label>
                <CustomSelect
                  options={werkstaetten.map((w) => ({ value: w.id, label: `${w.name} - ${w.adresse}` }))}
                  value={formData.werkstatt_standort_id}
                  onChange={(value) => setFormData({ ...formData, werkstatt_standort_id: value })}
                  placeholder="Werkstatt auswählen..."
                  required
                  icon={<Building2 className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Versicherung des Kunden *</label>
                <CustomSelect
                  options={DEUTSCHE_VERSICHERUNGEN.map((v) => ({ value: v.name, label: v.name }))}
                  value={formData.vers_name}
                  onChange={(value) => setFormData({ ...formData, vers_name: value })}
                  placeholder="Versicherung auswählen..."
                  required
                  icon={<Shield className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Schadensdetails */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-semibold">3</div>
                <span className="font-semibold text-purple-900">Schadensdetails</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Schadensart *</label>
                <CustomSelect
                  options={SCHADENSARTEN.map((s) => ({ value: s.value, label: s.label }))}
                  value={formData.schadensart}
                  onChange={(value) => setFormData({ ...formData, schadensart: value as DamageType })}
                  placeholder="Schadensart auswählen..."
                  required
                  icon={<FileText className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Schadensdatum *</label>
                <CustomDatePicker
                  value={formData.schaden_datum}
                  onChange={(value) => setFormData({ ...formData, schaden_datum: value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  placeholder="Datum auswählen..."
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* Optional Details (Collapsible) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                Weitere Details (optional)
              </span>
              {showDetails ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showDetails && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Vers.-Nr.</label>
                    <input
                      type="text"
                      value={formData.vers_nr}
                      onChange={(e) => setFormData({ ...formData, vers_nr: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                      placeholder="VS-123456"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Selbstbet. (EUR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.selbstbeteiligung}
                      onChange={(e) => setFormData({ ...formData, selbstbeteiligung: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                      placeholder="150.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Kennzeichen</label>
                    <input
                      type="text"
                      value={formData.kennzeichen}
                      onChange={(e) => setFormData({ ...formData, kennzeichen: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                      placeholder="M-AB 1234"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">VIN</label>
                    <input
                      type="text"
                      maxLength={17}
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase().replace(/[IOQ]/g, '') })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                      placeholder="WVW..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Beschreibung</label>
                  <textarea
                    value={formData.beschreibung}
                    onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all min-h-[80px] resize-none"
                    placeholder="Weitere Informationen..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
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
      </main>
    </div>
    </>
  )
}
