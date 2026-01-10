'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type DamageType, type PaymentStatus } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'

interface ProvisionClaim {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  schadensart: DamageType
  schaden_datum: string
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  versicherung_id: string
  vermittler_firma: string | null
  versicherung?: {
    firma: string
    ansprechpartner: string
    bankname: string | null
    iban: string | null
  }
}

// Standard-Provisionen bis individuelle Konfiguration implementiert ist
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

export default function ProvisionenPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { showSuccess, AnimationComponent } = useSuccessAnimation()

  const [claims, setClaims] = useState<ProvisionClaim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'alle' | 'nicht_bezahlt' | 'bezahlt'>('alle')

  useEffect(() => {
    loadClaims()
  }, [])

  async function loadClaims() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Hole Werkstatt
    const { data: werkstattData } = await supabase
      .from('werkstaetten')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!werkstattData) {
      router.push('/login')
      return
    }

    // Hole Standort-IDs
    const { data: standorteData } = await supabase
      .from('werkstatt_standorte')
      .select('id')
      .eq('werkstatt_id', werkstattData.id)

    if (!standorteData || standorteData.length === 0) {
      setIsLoading(false)
      return
    }

    const standortIds = standorteData.map(s => s.id)

    // Hole Claims: reparatur_abgeschlossen (offen) ODER abgeschlossen mit bezahlt
    // Gelöschte Claims ausschließen
    const { data: claimsData, error: claimsError } = await supabase
      .from('claims')
      .select('*')
      .in('werkstatt_standort_id', standortIds)
      .eq('is_deleted', false)
      .or('status.eq.reparatur_abgeschlossen,and(status.eq.abgeschlossen,payment_status.eq.bezahlt)')
      .order('created_at', { ascending: false })

    if (claimsError) {
      console.error('Error loading claims:', claimsError)
      setIsLoading(false)
      return
    }

    if (claimsData && claimsData.length > 0) {
      // Load versicherung data separately with bank info
      const versicherungIds = [...new Set(claimsData.map(c => c.versicherung_id))]
      const { data: versicherungData } = await supabase
        .from('versicherungen')
        .select('id, firma, ansprechpartner, bankname, iban')
        .in('id', versicherungIds)

      const versicherungMap = new Map(versicherungData?.map(v => [v.id, v]) || [])

      const claimsWithVersicherung = claimsData.map(claim => ({
        ...claim,
        versicherung: versicherungMap.get(claim.versicherung_id) || null
      }))

      setClaims(claimsWithVersicherung as ProvisionClaim[])
    }

    setIsLoading(false)
  }

  async function togglePaymentStatus(claimId: string, currentStatus: PaymentStatus | null | undefined) {
    // Treat null/undefined as 'nicht_bezahlt'
    const effectiveStatus = currentStatus || 'nicht_bezahlt'
    const newStatus: PaymentStatus = effectiveStatus === 'nicht_bezahlt' ? 'bezahlt' : 'nicht_bezahlt'

    const { error } = await supabase
      .from('claims')
      .update({
        payment_status: newStatus,
        // Status anpassen: bezahlt -> abgeschlossen, offen -> reparatur_abgeschlossen
        status: newStatus === 'bezahlt' ? 'abgeschlossen' : 'reparatur_abgeschlossen'
      })
      .eq('id', claimId)

    if (error) {
      console.error('Payment status update error:', error)
      toast.error('Fehler beim Aktualisieren: ' + error.message)
      return
    }

    // Update claim in list (don't remove - it stays visible in "Bezahlt" and "Alle" filters)
    setClaims(claims.map(c =>
      c.id === claimId ? { ...c, payment_status: newStatus } : c
    ))
    showSuccess(newStatus === 'bezahlt' ? 'Als bezahlt markiert' : 'Als offen markiert', newStatus === 'bezahlt' ? 'green' : 'red')
  }

  const filteredClaims = claims.filter(claim => {
    if (filter === 'alle') return true
    if (filter === 'nicht_bezahlt') {
      return !claim.payment_status || claim.payment_status === 'nicht_bezahlt'
    }
    return claim.payment_status === filter
  })

  const totalProvision = filteredClaims.reduce((sum, claim) => sum + getProvision(claim.schadensart), 0)
  const unpaidCount = claims.filter(c => !c.payment_status || c.payment_status === 'nicht_bezahlt').length
  const unpaidTotal = claims
    .filter(c => !c.payment_status || c.payment_status === 'nicht_bezahlt')
    .reduce((sum, claim) => sum + getProvision(claim.schadensart), 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="navbar sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/werkstatt" className="btn-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Provisionsliste</h1>
              <p className="text-sm text-muted">Offene Provisionen verwalten</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{claims.length}</p>
                <p className="text-sm text-muted">Aufträge gesamt</p>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{unpaidCount}</p>
                <p className="text-sm text-muted">Nicht bezahlt</p>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{unpaidTotal.toFixed(2)} EUR</p>
                <p className="text-sm text-muted">Offene Summe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('alle')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === 'alle'
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-[hsl(var(--border))] hover:border-orange-300'
            }`}
          >
            Alle ({claims.length})
          </button>
          <button
            onClick={() => setFilter('nicht_bezahlt')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === 'nicht_bezahlt'
                ? 'bg-red-500 text-white'
                : 'bg-white border border-[hsl(var(--border))] hover:border-red-300'
            }`}
          >
            Nicht bezahlt ({unpaidCount})
          </button>
          <button
            onClick={() => setFilter('bezahlt')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === 'bezahlt'
                ? 'bg-green-500 text-white'
                : 'bg-white border border-[hsl(var(--border))] hover:border-green-300'
            }`}
          >
            Bezahlt ({claims.filter(c => c.payment_status === 'bezahlt').length})
          </button>
        </div>

        {/* Claims List */}
        <div className="card overflow-hidden">
          {filteredClaims.length === 0 ? (
            <div className="p-12 text-center">
              <div className="icon-box icon-box-lg mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="heading-3 mb-2">Keine Provisionen</h3>
              <p className="text-muted">
                {filter === 'alle'
                  ? 'Abgeschlossene Reparaturen erscheinen hier.'
                  : filter === 'nicht_bezahlt'
                  ? 'Alle Provisionen sind bezahlt.'
                  : 'Noch keine bezahlten Provisionen.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Kunde</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Versicherung</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Schadensart</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Provision</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-[hsl(var(--muted))]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/werkstatt/provisionen/${claim.id}`} className="block">
                        <p className="font-semibold group-hover:text-orange-600 transition-colors">{claim.kunde_vorname} {claim.kunde_nachname}</p>
                        <p className="text-sm text-muted">{claim.kennzeichen || 'Kein Kennzeichen'}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/werkstatt/provisionen/${claim.id}`} className="block">
                        <p className="font-medium">{claim.vermittler_firma || '-'}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/werkstatt/provisionen/${claim.id}`} className="block">
                        <span className="text-sm">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/werkstatt/provisionen/${claim.id}`} className="block">
                        <span className="font-bold text-green-600">{getProvision(claim.schadensart).toFixed(2)} EUR</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        claim.payment_status === 'bezahlt'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {claim.payment_status === 'bezahlt' ? 'Bezahlt' : 'Offen'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/werkstatt/provisionen/${claim.id}`}
                          className="px-3 py-2 rounded-xl text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-all"
                        >
                          Details
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePaymentStatus(claim.id, claim.payment_status) }}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            claim.payment_status === 'bezahlt'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {claim.payment_status === 'bezahlt' ? 'Rückgängig' : 'Bezahlt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[hsl(var(--muted))] font-semibold">
                <tr>
                  <td colSpan={3} className="px-6 py-4">Summe ({filteredClaims.length} Aufträge)</td>
                  <td className="px-6 py-4 text-right text-green-600">{totalProvision.toFixed(2)} EUR</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </main>
    </div>
    </>
  )
}
