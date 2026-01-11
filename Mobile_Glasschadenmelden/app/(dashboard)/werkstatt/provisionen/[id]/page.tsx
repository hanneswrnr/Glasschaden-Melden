'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type DamageType, type PaymentStatus } from '@/lib/supabase/database.types'
import { ArrowLeft, Building2, CreditCard, Calendar, AlertTriangle, MapPin } from 'lucide-react'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'

interface ProvisionDetail {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  schadensart: DamageType
  schaden_datum: string
  payment_status: PaymentStatus
  created_at: string
  werkstatt_standort_id: string | null
  vermittler_firma: string | null
  versicherung?: {
    firma: string
    ansprechpartner: string
    email: string
    telefon: string
    bankname: string | null
    iban: string | null
  }
  standort?: {
    name: string
    adresse: string
    ansprechpartner: string
    telefon: string
  }
}

// Standard-Provisionen
const STANDARD_PROVISIONEN: Record<string, number> = {
  steinschlag: 10,
  frontscheibe_steinschlag: 10,
  austausch: 50,
  frontscheibe_austausch: 50,
  riss: 20,
  seitenscheibe_austausch: 20,
  sonstiges: 20,
  heckscheibe_austausch: 20,
}

function getProvision(schadensart: DamageType): number {
  return STANDARD_PROVISIONEN[schadensart] || 0
}

export default function ProvisionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const claimId = params.id as string
  const supabase = getSupabaseClient()
  const { showSuccess, AnimationComponent } = useSuccessAnimation()

  const [claim, setClaim] = useState<ProvisionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadClaim()
  }, [claimId])

  async function loadClaim() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Load claim
    const { data: claimData, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single()

    if (error || !claimData) {
      toast.error('Provision nicht gefunden')
      router.push('/werkstatt/provisionen')
      return
    }

    // Load versicherung data
    let versicherungData = null
    if (claimData.versicherung_id) {
      const { data, error: versicherungError } = await supabase
        .from('versicherungen')
        .select('firma, ansprechpartner, email, telefon, bankname, iban')
        .eq('id', claimData.versicherung_id)
        .single()

      if (versicherungError) {
        console.error('Error loading versicherung data:', versicherungError)
        console.log('versicherung_id:', claimData.versicherung_id)
      } else {
        console.log('Loaded versicherung data:', data)
      }
      versicherungData = data
    } else {
      console.log('No versicherung_id on claim')
    }

    // Load standort data
    let standortData = null
    if (claimData.werkstatt_standort_id) {
      const { data } = await supabase
        .from('werkstatt_standorte')
        .select('name, adresse, ansprechpartner, telefon')
        .eq('id', claimData.werkstatt_standort_id)
        .single()
      standortData = data
    }

    setClaim({
      ...claimData,
      versicherung: versicherungData || undefined,
      standort: standortData || undefined
    } as ProvisionDetail)

    setIsLoading(false)
  }

  async function togglePaymentStatus() {
    if (!claim) return

    setIsSaving(true)
    // Treat null/undefined as 'nicht_bezahlt'
    const effectiveStatus = claim.payment_status || 'nicht_bezahlt'
    const newStatus: PaymentStatus = effectiveStatus === 'nicht_bezahlt' ? 'bezahlt' : 'nicht_bezahlt'

    const { error } = await supabase
      .from('claims')
      .update({
        payment_status: newStatus,
        // Status anpassen: bezahlt -> abgeschlossen, offen -> reparatur_abgeschlossen
        status: newStatus === 'bezahlt' ? 'abgeschlossen' : 'reparatur_abgeschlossen'
      })
      .eq('id', claim.id)

    if (error) {
      console.error('Payment status update error:', error)
      toast.error('Fehler beim Aktualisieren: ' + error.message)
    } else {
      setClaim({ ...claim, payment_status: newStatus })
      showSuccess(newStatus === 'bezahlt' ? 'Als bezahlt markiert' : 'Als offen markiert', newStatus === 'bezahlt' ? 'green' : 'red')
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!claim) return null

  const provision = getProvision(claim.schadensart)

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link
          href="/werkstatt/provisionen"
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="font-semibold text-lg">Provisionsdetails</h1>
          <p className="text-xs text-orange-600 font-mono">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-8 space-y-4">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm mb-1">Provision</p>
              <p className="text-3xl font-bold whitespace-nowrap">{provision.toFixed(2)} EUR</p>
            </div>
            <span className={`px-3 py-1 rounded-xl text-sm font-medium ${
              claim.payment_status === 'bezahlt'
                ? 'bg-white/30 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {claim.payment_status === 'bezahlt' ? 'Bezahlt' : 'Offen'}
            </span>
          </div>
          <div className="pt-4 border-t border-white/20">
            <p className="font-semibold text-lg">{claim.kunde_vorname} {claim.kunde_nachname}</p>
            <p className="text-green-100 text-sm">{claim.kennzeichen || 'Kein Kennzeichen'}</p>
          </div>
        </div>

        {/* Schaden Info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-sm text-slate-900">Schadensinfo</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Schadensart</p>
              <p className="text-sm font-medium">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Schadensdatum</p>
              <p className="text-sm font-medium">{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</p>
            </div>
          </div>
        </div>

        {/* Standort */}
        {claim.standort && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-sm text-slate-900">Zugewiesener Standort</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Standort</p>
                <p className="text-sm font-semibold text-slate-900">{claim.standort.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Adresse</p>
                <p className="text-sm font-medium">{claim.standort.adresse}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ansprechpartner</p>
                  <p className="text-sm font-medium">{claim.standort.ansprechpartner}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Telefon</p>
                  <p className="text-sm font-medium">{claim.standort.telefon}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Versicherung */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-purple-500" />
            <span className="font-semibold text-sm text-slate-900">Vermittelnde Versicherung</span>
          </div>

          {/* Vermittler-Firma prominent anzeigen */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 mb-3">
            <p className="text-xs font-medium text-purple-600 mb-1">Vermittelt durch</p>
            <p className="font-bold text-purple-900">{claim.vermittler_firma || claim.versicherung?.firma || '-'}</p>
          </div>

          {claim.versicherung && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ansprechpartner</p>
                  <p className="text-sm font-medium">{claim.versicherung.ansprechpartner}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Telefon</p>
                  <p className="text-sm font-medium">{claim.versicherung.telefon}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">E-Mail</p>
                <p className="text-sm font-medium">{claim.versicherung.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-sm text-slate-900">Bankdaten</span>
          </div>

          {(claim.versicherung?.bankname && claim.versicherung.bankname.trim()) || (claim.versicherung?.iban && claim.versicherung.iban.trim()) ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Bankname</p>
                <p className="text-sm font-medium">{claim.versicherung?.bankname || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">IBAN</p>
                <p className="text-sm font-mono font-medium">{claim.versicherung?.iban || '-'}</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <p className="font-medium text-sm text-yellow-800">Keine Bankdaten</p>
              </div>
              <p className="text-xs text-yellow-600">Auszahlung erfolgt bar</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={togglePaymentStatus}
          disabled={isSaving}
          className={`w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] ${
            claim.payment_status === 'bezahlt'
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
          } disabled:opacity-50`}
        >
          {isSaving ? 'Wird aktualisiert...' :
           claim.payment_status === 'bezahlt' ? 'Als offen markieren' : 'Als bezahlt markieren'}
        </button>
      </main>
    </div>
    </>
  )
}
