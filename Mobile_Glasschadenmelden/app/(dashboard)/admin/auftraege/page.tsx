'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { ArrowLeft, Search, FileText, ChevronRight, Trash2 } from 'lucide-react'

interface Claim {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  schadensart: DamageType
  schaden_datum: string
  status: ClaimStatus
  created_at: string
  versicherung?: {
    firma: string
  }
  standort?: {
    name: string
  }
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string; color: string }[] = [
  { value: 'neu', label: 'Neu', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-700' },
  { value: 'reparatur_abgeschlossen', label: 'Reparatur fertig', color: 'bg-purple-100 text-purple-700' },
  { value: 'abgeschlossen', label: 'Erledigt', color: 'bg-green-100 text-green-700' },
]

export default function AdminAuftraegePage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { showSuccess, AnimationComponent } = useSuccessAnimation()

  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'alle' | ClaimStatus>('alle')
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; claimId: string | null; claimName: string; auftragsnummer: string }>({
    show: false,
    claimId: null,
    claimName: '',
    auftragsnummer: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)

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

    loadClaims()
  }

  async function loadClaims() {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading claims:', error)
      toast.error('Fehler beim Laden')
    } else {
      setClaims(data || [])
    }
    setIsLoading(false)
  }

  async function handleDelete() {
    if (!deleteConfirm.claimId) return

    setIsDeleting(true)
    const { error } = await supabase.rpc('soft_delete_claim', { claim_uuid: deleteConfirm.claimId })

    if (error) {
      toast.error('Fehler beim Löschen')
    } else {
      setClaims(claims.filter(c => c.id !== deleteConfirm.claimId))
      showSuccess('In Papierkorb verschoben', 'orange')
    }
    setIsDeleting(false)
    setDeleteConfirm({ show: false, claimId: null, claimName: '', auftragsnummer: '' })
  }

  const filteredClaims = claims.filter(claim => {
    const matchesFilter = filter === 'alle' || claim.status === filter
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = searchTerm === '' ||
      claim.kunde_vorname.toLowerCase().includes(searchLower) ||
      claim.kunde_nachname.toLowerCase().includes(searchLower) ||
      claim.kennzeichen?.toLowerCase().includes(searchLower) ||
      claim.auftragsnummer?.toLowerCase().includes(searchLower)
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link
          href="/admin"
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold text-base">Alle Aufträge</h1>
          <p className="text-xs text-slate-500">{claims.length} Aufträge</p>
        </div>
        <Link
          href="/admin/papierkorb"
          className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Trash2 className="w-5 h-5 text-orange-600" />
        </Link>
      </header>

      <main className="flex-1 p-4 pb-8">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Name, Kennzeichen, Auftragsnr. (GS-...)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-xl pl-12 pr-4 py-3 border border-slate-200 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setFilter('alle')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'alle' ? 'bg-red-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Alle
          </button>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === option.value ? option.color.replace('100', '500').replace('700', 'white') : `${option.color}`
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Claims List */}
        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Keine Aufträge gefunden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map((claim) => {
              const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)
              return (
                <div key={claim.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <Link
                    href={`/admin/auftraege/${claim.id}`}
                    className="block p-4 active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-xs text-red-600 font-medium mb-1">{claim.auftragsnummer || '-'}</p>
                        <h3 className="font-semibold text-slate-900">
                          {claim.kunde_vorname} {claim.kunde_nachname}
                        </h3>
                        <p className="text-sm text-slate-500">{claim.kennzeichen || 'Kein Kennzeichen'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusOption?.color || ''}`}>
                        {statusOption?.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>{new Date(claim.created_at).toLocaleDateString('de-DE')}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {claim.versicherung?.firma || '-'} → {claim.standort?.name || 'Keine Werkstatt'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setDeleteConfirm({
                          show: true,
                          claimId: claim.id,
                          claimName: `${claim.kunde_vorname} ${claim.kunde_nachname}`,
                          auftragsnummer: claim.auftragsnummer || ''
                        })
                      }}
                      className="p-2 rounded-lg text-orange-600 active:bg-orange-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">In Papierkorb?</h3>
              <p className="text-sm text-slate-600">
                Auftrag <span className="font-mono font-semibold text-red-600">{deleteConfirm.auftragsnummer}</span> von <span className="font-semibold">{deleteConfirm.claimName}</span> wird in den Papierkorb verschoben.
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setDeleteConfirm({ show: false, claimId: null, claimName: '', auftragsnummer: '' })}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200 active:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-4 text-orange-600 font-semibold active:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Verschieben...' : 'In Papierkorb'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
