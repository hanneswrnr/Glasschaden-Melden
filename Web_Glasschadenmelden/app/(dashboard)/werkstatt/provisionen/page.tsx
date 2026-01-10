'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type DamageType, type PaymentStatus } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { ArrowLeft, DollarSign, AlertCircle, CheckCircle, ChevronRight, ClipboardList } from 'lucide-react'

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
      <div className="min-h-screen bg-slate-50 md:bg-gradient-subtle flex items-center justify-center">
        <div className="md:hidden w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <div className="hidden md:block spinner" />
      </div>
    )
  }

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-slate-50 md:bg-gradient-subtle flex flex-col">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link
          href="/werkstatt"
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="font-semibold text-lg">Provisionen</h1>
          <p className="text-xs text-slate-500">{unpaidCount} offen</p>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block navbar sticky top-0 z-50">
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

      <main className="flex-1 p-4 pb-8 md:max-w-6xl md:mx-auto md:px-6 md:py-8">
        {/* Mobile Summary Card */}
        <div className="md:hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 mb-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Offene Summe</p>
              <p className="text-3xl font-bold">{unpaidTotal.toFixed(2)} EUR</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Mobile Stats Row */}
        <div className="md:hidden grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-slate-500">Offen</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{unpaidCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-slate-500">Bezahlt</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{claims.filter(c => c.payment_status === 'bezahlt').length}</p>
          </div>
        </div>

        {/* Desktop Summary Cards */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-orange-600" />
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
                <AlertCircle className="w-6 h-6 text-red-600" />
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
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unpaidTotal.toFixed(2)} EUR</p>
                <p className="text-sm text-muted">Offene Summe</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-1 md:overflow-visible md:pb-0">
          <button
            onClick={() => setFilter('alle')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              filter === 'alle'
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-slate-200 md:border-[hsl(var(--border))] md:hover:border-orange-300'
            }`}
          >
            Alle ({claims.length})
          </button>
          <button
            onClick={() => setFilter('nicht_bezahlt')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              filter === 'nicht_bezahlt'
                ? 'bg-red-500 text-white'
                : 'bg-white border border-slate-200 md:border-[hsl(var(--border))] md:hover:border-red-300'
            }`}
          >
            Nicht bezahlt ({unpaidCount})
          </button>
          <button
            onClick={() => setFilter('bezahlt')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              filter === 'bezahlt'
                ? 'bg-green-500 text-white'
                : 'bg-white border border-slate-200 md:border-[hsl(var(--border))] md:hover:border-green-300'
            }`}
          >
            Bezahlt ({claims.filter(c => c.payment_status === 'bezahlt').length})
          </button>
        </div>

        {/* Mobile Claims List */}
        <div className="md:hidden">
          {filteredClaims.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Keine Provisionen</h4>
              <p className="text-sm text-slate-500">
                {filter === 'nicht_bezahlt'
                  ? 'Alle Provisionen sind bezahlt.'
                  : 'Keine Daten vorhanden.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                >
                  <Link
                    href={`/werkstatt/provisionen/${claim.id}`}
                    className="block p-4 active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {claim.kunde_vorname} {claim.kunde_nachname}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {claim.kennzeichen || 'Kein Kennzeichen'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          claim.payment_status === 'bezahlt'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {claim.payment_status === 'bezahlt' ? 'Bezahlt' : 'Offen'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500">
                        {DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}
                      </span>
                      <span className="font-bold text-green-600">
                        {getProvision(claim.schadensart).toFixed(2)} EUR
                      </span>
                    </div>

                    {claim.vermittler_firma && (
                      <p className="text-xs text-orange-600">
                        {claim.vermittler_firma}
                      </p>
                    )}
                  </Link>

                  <div className="px-4 pb-4">
                    <button
                      onClick={(e) => { e.preventDefault(); togglePaymentStatus(claim.id, claim.payment_status) }}
                      className={`w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${
                        claim.payment_status === 'bezahlt'
                          ? 'bg-red-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {claim.payment_status === 'bezahlt' ? 'Als offen markieren' : 'Als bezahlt markieren'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Claims Table */}
        <div className="hidden md:block card overflow-hidden">
          {filteredClaims.length === 0 ? (
            <div className="p-12 text-center">
              <div className="icon-box icon-box-lg mx-auto mb-4">
                <DollarSign className="w-8 h-8" />
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
