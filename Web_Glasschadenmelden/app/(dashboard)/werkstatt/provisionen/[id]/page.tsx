'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type DamageType, type PaymentStatus } from '@/lib/supabase/database.types'
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
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!claim) return null

  const provision = getProvision(claim.schadensart)

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="navbar sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/werkstatt/provisionen" className="btn-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Provisionsdetails</h1>
              <p className="text-sm text-muted font-mono">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Provision Summary Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">{claim.kunde_vorname} {claim.kunde_nachname}</h2>
              <p className="text-muted">{claim.kennzeichen || 'Kein Kennzeichen'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">{provision.toFixed(2)} EUR</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                claim.payment_status === 'bezahlt'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {claim.payment_status === 'bezahlt' ? 'Bezahlt' : 'Offen'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[hsl(var(--border))]">
            <div>
              <p className="text-sm text-muted mb-1">Schadensart</p>
              <p className="font-medium">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">Schadensdatum</p>
              <p className="font-medium">{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</p>
            </div>
          </div>
        </div>

        {/* Standort Card */}
        {claim.standort && (
          <div className="card p-6 mb-6">
            <h3 className="heading-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Zugewiesener Standort
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted mb-1">Standort</p>
                  <p className="font-semibold">{claim.standort.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">Adresse</p>
                  <p className="font-medium">{claim.standort.adresse}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted mb-1">Ansprechpartner</p>
                  <p className="font-medium">{claim.standort.ansprechpartner}</p>
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">Telefon</p>
                  <p className="font-medium">{claim.standort.telefon}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Versicherung Card */}
        <div className="card p-6 mb-6">
          <h3 className="heading-3 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Vermittelnde Versicherung
          </h3>

          {/* Vermittler-Firma prominent anzeigen */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 mb-4">
            <p className="text-xs font-medium text-purple-600 mb-1">Vermittelt durch</p>
            <p className="font-bold text-purple-900 text-lg">{claim.vermittler_firma || claim.versicherung?.firma || '-'}</p>
          </div>

          {claim.versicherung && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted mb-1">Ansprechpartner</p>
                  <p className="font-medium">{claim.versicherung.ansprechpartner}</p>
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">Telefon</p>
                  <p className="font-medium">{claim.versicherung.telefon}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">E-Mail</p>
                <p className="font-medium">{claim.versicherung.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bank Details Card */}
        <div className="card p-6 mb-6">
          <h3 className="heading-3 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Bankdaten für Provisionsüberweisung
          </h3>

          {(claim.versicherung?.bankname && claim.versicherung.bankname.trim()) || (claim.versicherung?.iban && claim.versicherung.iban.trim()) ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted mb-1">Bankname</p>
                  <p className="font-medium">{claim.versicherung?.bankname || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">IBAN</p>
                  <p className="font-mono font-medium">{claim.versicherung?.iban || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-yellow-50 rounded-xl border border-yellow-100">
              <svg className="w-8 h-8 text-yellow-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium text-yellow-800">Keine Bankdaten hinterlegt</p>
              <p className="text-sm text-yellow-600 mt-1">Auszahlung erfolgt bar</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={togglePaymentStatus}
          disabled={isSaving}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            claim.payment_status === 'bezahlt'
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-500 text-white hover:bg-green-600'
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
