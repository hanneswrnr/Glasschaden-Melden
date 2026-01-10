'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'

interface DeletedClaim {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  schadensart: DamageType
  status: ClaimStatus
  deleted_at: string
  created_at: string
  vermittler_firma: string | null
  werkstatt_name: string | null
}

const STATUS_COLORS: Record<ClaimStatus, string> = {
  neu: 'bg-yellow-100 text-yellow-700',
  in_bearbeitung: 'bg-blue-100 text-blue-700',
  reparatur_abgeschlossen: 'bg-purple-100 text-purple-700',
  abgeschlossen: 'bg-green-100 text-green-700',
  storniert: 'bg-red-100 text-red-700',
}

export default function AdminPapierkorbPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { showSuccess, AnimationComponent } = useSuccessAnimation()

  const [deletedClaims, setDeletedClaims] = useState<DeletedClaim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionConfirm, setActionConfirm] = useState<{
    show: boolean
    type: 'restore' | 'permanent_delete'
    claimId: string | null
    claimName: string
    auftragsnummer: string
  }>({
    show: false,
    type: 'restore',
    claimId: null,
    claimName: '',
    auftragsnummer: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      router.push('/login')
      return
    }

    loadDeletedClaims()
  }

  async function loadDeletedClaims() {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('Error loading deleted claims:', error)
      toast.error('Fehler beim Laden')
    } else {
      setDeletedClaims(data || [])
    }
    setIsLoading(false)
  }

  async function handleRestore() {
    if (!actionConfirm.claimId) return

    setIsProcessing(true)
    const { error } = await supabase.rpc('restore_claim', { claim_uuid: actionConfirm.claimId })

    if (error) {
      console.error('Restore error:', error)
      toast.error('Fehler beim Wiederherstellen')
    } else {
      setDeletedClaims(deletedClaims.filter(c => c.id !== actionConfirm.claimId))
      showSuccess('Auftrag wiederhergestellt', 'green')
    }
    setIsProcessing(false)
    setActionConfirm({ show: false, type: 'restore', claimId: null, claimName: '', auftragsnummer: '' })
  }

  async function handlePermanentDelete() {
    if (!actionConfirm.claimId) return

    setIsProcessing(true)
    const { error } = await supabase.rpc('permanent_delete_claim', { claim_uuid: actionConfirm.claimId })

    if (error) {
      console.error('Permanent delete error:', error)
      toast.error('Fehler beim endgültigen Löschen')
    } else {
      setDeletedClaims(deletedClaims.filter(c => c.id !== actionConfirm.claimId))
      showSuccess('Endgültig gelöscht', 'red')
    }
    setIsProcessing(false)
    setActionConfirm({ show: false, type: 'restore', claimId: null, claimName: '', auftragsnummer: '' })
  }

  const filteredClaims = deletedClaims.filter(claim => {
    if (searchTerm === '') return true
    const searchLower = searchTerm.toLowerCase()
    return (
      claim.kunde_vorname.toLowerCase().includes(searchLower) ||
      claim.kunde_nachname.toLowerCase().includes(searchLower) ||
      claim.kennzeichen?.toLowerCase().includes(searchLower) ||
      claim.auftragsnummer?.toLowerCase().includes(searchLower)
    )
  })

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/auftraege" className="btn-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Papierkorb</h1>
              <p className="text-sm text-muted">{deletedClaims.length} gelöschte Aufträge</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-500 text-white text-sm font-medium">Administrator</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-orange-800 font-medium">Aufträge im Papierkorb</p>
            <p className="text-sm text-orange-600">Gelöschte Aufträge können wiederhergestellt oder endgültig gelöscht werden.</p>
          </div>
        </div>

        {/* Search */}
        {deletedClaims.length > 0 && (
          <div className="card p-4 mb-6">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Suche nach Name, Kennzeichen, Auftragsnummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Deleted Claims Table */}
        <div className="card overflow-hidden">
          {filteredClaims.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <p className="text-lg font-medium text-muted">Papierkorb ist leer</p>
              <p className="text-sm text-slate-400 mt-1">Gelöschte Aufträge erscheinen hier</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Auftragsnr.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Kunde</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Versicherung</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Schadensart</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Gelöscht am</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-slate-500">{claim.auftragsnummer || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{claim.kunde_vorname} {claim.kunde_nachname}</p>
                          <p className="text-sm text-muted">{claim.kennzeichen || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{claim.vermittler_firma || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-500">
                          {claim.deleted_at ? new Date(claim.deleted_at).toLocaleString('de-DE') : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActionConfirm({
                              show: true,
                              type: 'restore',
                              claimId: claim.id,
                              claimName: `${claim.kunde_vorname} ${claim.kunde_nachname}`,
                              auftragsnummer: claim.auftragsnummer || ''
                            })}
                            className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200 transition-colors"
                          >
                            Wiederherstellen
                          </button>
                          <button
                            onClick={() => setActionConfirm({
                              show: true,
                              type: 'permanent_delete',
                              claimId: claim.id,
                              claimName: `${claim.kunde_vorname} ${claim.kunde_nachname}`,
                              auftragsnummer: claim.auftragsnummer || ''
                            })}
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            Endgültig löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Action Confirmation Dialog */}
      {actionConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                actionConfirm.type === 'restore' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {actionConfirm.type === 'restore' ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {actionConfirm.type === 'restore' ? 'Auftrag wiederherstellen?' : 'Endgültig löschen?'}
              </h3>
              <p className="text-slate-600">
                {actionConfirm.type === 'restore' ? (
                  <>Auftrag <span className="font-mono font-semibold">{actionConfirm.auftragsnummer}</span> von <span className="font-semibold">{actionConfirm.claimName}</span> wird wiederhergestellt und erscheint wieder in der Hauptliste.</>
                ) : (
                  <>Auftrag <span className="font-mono font-semibold">{actionConfirm.auftragsnummer}</span> von <span className="font-semibold">{actionConfirm.claimName}</span> wird <span className="text-red-600 font-semibold">unwiderruflich gelöscht</span>. Diese Aktion kann nicht rückgängig gemacht werden.</>
                )}
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setActionConfirm({ show: false, type: 'restore', claimId: null, claimName: '', auftragsnummer: '' })}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={actionConfirm.type === 'restore' ? handleRestore : handlePermanentDelete}
                disabled={isProcessing}
                className={`flex-1 py-4 font-semibold transition-colors disabled:opacity-50 ${
                  actionConfirm.type === 'restore'
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                {isProcessing ? 'Wird verarbeitet...' : (actionConfirm.type === 'restore' ? 'Wiederherstellen' : 'Endgültig löschen')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
