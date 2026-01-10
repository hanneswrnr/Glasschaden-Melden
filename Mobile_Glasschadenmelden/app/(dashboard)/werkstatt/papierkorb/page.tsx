'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { ArrowLeft, Search, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'

interface DeletedClaim {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  schadensart: DamageType
  status: ClaimStatus
  deleted_at: string
  vermittler_firma: string | null
}

export default function WerkstattPapierkorbPage() {
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

    if (!profile || profile.role !== 'werkstatt') {
      router.push('/login')
      return
    }

    const { data: werkstattData } = await supabase
      .from('werkstaetten')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (werkstattData) {
      loadDeletedClaims(werkstattData.id)
    }
  }

  async function loadDeletedClaims(werkstattId: string) {
    const { data: standorteData } = await supabase
      .from('werkstatt_standorte')
      .select('id')
      .eq('werkstatt_id', werkstattId)

    if (!standorteData || standorteData.length === 0) {
      setIsLoading(false)
      return
    }

    const standortIds = standorteData.map(s => s.id)

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .in('werkstatt_standort_id', standortIds)
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false })

    if (error) {
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
      toast.error('Fehler beim Wiederherstellen')
    } else {
      setDeletedClaims(deletedClaims.filter(c => c.id !== actionConfirm.claimId))
      showSuccess('Wiederhergestellt', 'green')
    }
    setIsProcessing(false)
    setActionConfirm({ show: false, type: 'restore', claimId: null, claimName: '', auftragsnummer: '' })
  }

  async function handlePermanentDelete() {
    if (!actionConfirm.claimId) return

    setIsProcessing(true)
    const { error } = await supabase.rpc('permanent_delete_claim', { claim_uuid: actionConfirm.claimId })

    if (error) {
      toast.error('Fehler beim Löschen')
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link href="/werkstatt/auftraege" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold text-base">Papierkorb</h1>
          <p className="text-xs text-slate-500">{deletedClaims.length} gelöschte Aufträge</p>
        </div>
      </header>

      <main className="flex-1 p-4 pb-8">
        {/* Info Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-800 font-medium">Gelöschte Aufträge</p>
            <p className="text-xs text-orange-600">Hier können Sie Aufträge wiederherstellen oder endgültig löschen.</p>
          </div>
        </div>

        {/* Search */}
        {deletedClaims.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Name, Kennzeichen, Auftragsnr..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white rounded-xl pl-12 pr-4 py-3 border border-slate-200 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>
        )}

        {/* Deleted Claims */}
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">Papierkorb ist leer</p>
            <p className="text-sm text-slate-500 mt-1">Gelöschte Aufträge erscheinen hier</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map((claim) => (
              <div key={claim.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-xs text-orange-600 font-medium mb-1">{claim.auftragsnummer || '-'}</p>
                      <h3 className="font-semibold text-slate-900">{claim.kunde_vorname} {claim.kunde_nachname}</h3>
                      <p className="text-sm text-slate-500">{claim.kennzeichen || '-'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                      Gelöscht
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</span>
                    <span className="text-slate-400 text-xs">
                      {claim.deleted_at ? new Date(claim.deleted_at).toLocaleDateString('de-DE') : '-'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 truncate">{claim.vermittler_firma || '-'}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setActionConfirm({
                        show: true,
                        type: 'restore',
                        claimId: claim.id,
                        claimName: `${claim.kunde_vorname} ${claim.kunde_nachname}`,
                        auftragsnummer: claim.auftragsnummer || ''
                      })}
                      className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
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
                      className="p-2 rounded-lg bg-red-100 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Action Confirmation Dialog */}
      {actionConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                actionConfirm.type === 'restore' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {actionConfirm.type === 'restore' ? (
                  <RotateCcw className="w-7 h-7 text-green-600" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {actionConfirm.type === 'restore' ? 'Wiederherstellen?' : 'Endgültig löschen?'}
              </h3>
              <p className="text-sm text-slate-600">
                {actionConfirm.type === 'restore' ? (
                  <>Auftrag <span className="font-mono font-semibold text-orange-600">{actionConfirm.auftragsnummer}</span> von <span className="font-semibold">{actionConfirm.claimName}</span> wird wiederhergestellt.</>
                ) : (
                  <>Auftrag <span className="font-mono font-semibold text-orange-600">{actionConfirm.auftragsnummer}</span> von <span className="font-semibold">{actionConfirm.claimName}</span> wird <span className="text-red-600 font-semibold">unwiderruflich gelöscht</span>.</>
                )}
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setActionConfirm({ show: false, type: 'restore', claimId: null, claimName: '', auftragsnummer: '' })}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200"
              >
                Abbrechen
              </button>
              <button
                onClick={actionConfirm.type === 'restore' ? handleRestore : handlePermanentDelete}
                disabled={isProcessing}
                className={`flex-1 py-4 font-semibold disabled:opacity-50 ${
                  actionConfirm.type === 'restore'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {isProcessing ? 'Wird verarbeitet...' : (actionConfirm.type === 'restore' ? 'Wiederherstellen' : 'Löschen')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
