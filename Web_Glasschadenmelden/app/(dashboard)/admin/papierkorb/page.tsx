'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { ArrowLeft, Search, Trash2, RotateCcw, AlertTriangle, Info } from 'lucide-react'

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
        <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-gradient-subtle pb-24 md:pb-8">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/auftraege"
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Papierkorb</h1>
            <p className="text-xs text-slate-500">{deletedClaims.length} gelöschte Aufträge</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block navbar sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/auftraege" className="btn-icon">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">Papierkorb</h1>
              <p className="text-sm text-muted">{deletedClaims.length} gelöschte Aufträge</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-500 text-white text-sm font-medium">Administrator</span>
        </div>
      </header>

      {/* Mobile Content */}
      <main className="md:hidden px-4 py-4 space-y-4">
        {/* Info Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-orange-800 font-medium">Aufträge im Papierkorb</p>
            <p className="text-xs text-orange-600">Können wiederhergestellt oder endgültig gelöscht werden.</p>
          </div>
        </div>

        {/* Search */}
        {deletedClaims.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Suche nach Name, Kennzeichen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
            />
          </div>
        )}

        {/* Deleted Claims Cards */}
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-500">Papierkorb ist leer</p>
            <p className="text-xs text-slate-400 mt-1">Gelöschte Aufträge erscheinen hier</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map((claim) => (
              <div key={claim.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{claim.kunde_vorname} {claim.kunde_nachname}</p>
                      <p className="text-xs text-slate-500">{claim.kennzeichen || '-'}</p>
                    </div>
                    <span className="font-mono text-xs text-slate-400">{claim.auftragsnummer || '-'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                      {DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}
                    </span>
                    <span className="px-2 py-1 bg-red-50 rounded-md text-red-600">
                      Gelöscht: {claim.deleted_at ? new Date(claim.deleted_at).toLocaleDateString('de-DE') : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex border-t border-slate-200 divide-x divide-slate-200">
                  <button
                    onClick={() => setActionConfirm({
                      show: true,
                      type: 'restore',
                      claimId: claim.id,
                      claimName: `${claim.kunde_vorname} ${claim.kunde_nachname}`,
                      auftragsnummer: claim.auftragsnummer || ''
                    })}
                    className="flex-1 py-3 flex items-center justify-center gap-2 text-green-600 font-medium active:bg-green-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm">Wiederherstellen</span>
                  </button>
                  <button
                    onClick={() => setActionConfirm({
                      show: true,
                      type: 'permanent_delete',
                      claimId: claim.id,
                      claimName: `${claim.kunde_vorname} ${claim.kunde_nachname}`,
                      auftragsnummer: claim.auftragsnummer || ''
                    })}
                    className="flex-1 py-3 flex items-center justify-center gap-2 text-red-600 font-medium active:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Löschen</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Desktop Content */}
      <main className="hidden md:block max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-800 font-medium">Aufträge im Papierkorb</p>
            <p className="text-sm text-orange-600">Gelöschte Aufträge können wiederhergestellt oder endgültig gelöscht werden.</p>
          </div>
        </div>

        {/* Search */}
        {deletedClaims.length > 0 && (
          <div className="card p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
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
              <Trash2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] md:p-6">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md overflow-hidden shadow-xl">
            <div className="p-5 md:p-6 text-center">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 ${
                actionConfirm.type === 'restore' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {actionConfirm.type === 'restore' ? (
                  <RotateCcw className="w-7 h-7 md:w-8 md:h-8 text-green-600" />
                ) : (
                  <AlertTriangle className="w-7 h-7 md:w-8 md:h-8 text-red-600" />
                )}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
                {actionConfirm.type === 'restore' ? 'Auftrag wiederherstellen?' : 'Endgültig löschen?'}
              </h3>
              <p className="text-sm md:text-base text-slate-600">
                {actionConfirm.type === 'restore' ? (
                  <>Auftrag von <span className="font-semibold">{actionConfirm.claimName}</span> wird wiederhergestellt und erscheint wieder in der Hauptliste.</>
                ) : (
                  <>Auftrag von <span className="font-semibold">{actionConfirm.claimName}</span> wird <span className="text-red-600 font-semibold">unwiderruflich gelöscht</span>. Diese Aktion kann nicht rückgängig gemacht werden.</>
                )}
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setActionConfirm({ show: false, type: 'restore', claimId: null, claimName: '', auftragsnummer: '' })}
                className="flex-1 py-3.5 md:py-4 text-slate-700 font-medium border-r border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={actionConfirm.type === 'restore' ? handleRestore : handlePermanentDelete}
                disabled={isProcessing}
                className={`flex-1 py-3.5 md:py-4 font-semibold transition-colors disabled:opacity-50 ${
                  actionConfirm.type === 'restore'
                    ? 'text-green-600 hover:bg-green-50 active:bg-green-100'
                    : 'text-red-600 hover:bg-red-50 active:bg-red-100'
                }`}
              >
                {isProcessing ? 'Verarbeiten...' : (actionConfirm.type === 'restore' ? 'Wiederherstellen' : 'Löschen')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
