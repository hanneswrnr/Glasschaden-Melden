'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Search, Trash2, Edit3, ChevronRight, ChevronDown } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { CLAIM_STATUS_LABELS, DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { StatusSelect } from '@/components/shared/StatusSelect'

interface Claim {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kunde_telefon: string
  kennzeichen: string | null
  schadensart: DamageType
  schaden_datum: string
  status: ClaimStatus
  created_at: string
  versicherung?: {
    firma: string
    ansprechpartner: string
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
      toast.error('Fehler beim Laden der Aufträge')
    } else {
      setClaims(data || [])
    }
    setIsLoading(false)
  }

  async function handleStatusChange(claimId: string, newStatus: ClaimStatus) {
    const { error } = await supabase
      .from('claims')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', claimId)

    if (error) {
      toast.error('Fehler beim Aktualisieren')
    } else {
      setClaims(claims.map(c => c.id === claimId ? { ...c, status: newStatus } : c))
      showSuccess(`Status auf "${CLAIM_STATUS_LABELS[newStatus]}" geändert`, newStatus)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm.claimId) return

    setIsDeleting(true)
    const { error } = await supabase.rpc('soft_delete_claim', { claim_uuid: deleteConfirm.claimId })

    if (error) {
      console.error('Delete error:', error)
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
      claim.versicherung?.firma.toLowerCase().includes(searchLower) ||
      claim.auftragsnummer?.toLowerCase().includes(searchLower)
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-gradient-subtle">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link
          href="/admin"
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 truncate">Alle Aufträge</h1>
          <p className="text-xs text-slate-500">{claims.length} Aufträge gesamt</p>
        </div>
        <Link
          href="/admin/papierkorb"
          className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center active:bg-red-600 transition-colors"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </Link>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:navbar sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="btn-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Alle Aufträge</h1>
              <p className="text-sm text-muted">{claims.length} Aufträge gesamt</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/papierkorb"
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Papierkorb
            </Link>
            <span className="px-3 py-1 rounded-full bg-red-500 text-white text-sm font-medium">Administrator</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-8 md:max-w-7xl md:mx-auto md:px-6 md:py-8">
        {/* Mobile: Search */}
        <div className="md:hidden bg-white rounded-xl p-3 mb-3 border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Suche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Mobile: Filter Pills */}
        <div className="md:hidden overflow-x-auto pb-3 -mx-4 px-4 mb-3">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setFilter('alle')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === 'alle' ? 'bg-red-500 text-white' : 'bg-white text-slate-600 border border-slate-200 active:bg-slate-50'
              }`}
            >
              Alle
            </button>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  filter === option.value ? option.color.replace('100', '500').replace('700', 'white') : option.color
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Filters */}
        <div className="hidden md:block card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Suche nach Name, Kennzeichen, Versicherung, Auftragsnummer (GS-...)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => setFilter('alle')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === 'alle' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Alle
              </button>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filter === option.value ? option.color.replace('100', '500').replace('700', 'white') : `${option.color} hover:opacity-80`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredClaims.length === 0 && (
          <div className="bg-white rounded-xl md:card p-8 md:p-12 text-center border border-slate-200 md:border-0">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-600">Keine Aufträge gefunden</p>
          </div>
        )}

        {/* Mobile: Card List */}
        {filteredClaims.length > 0 && (
          <div className="md:hidden space-y-3">
            {filteredClaims.map((claim) => {
              const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)
              return (
                <div key={claim.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <Link
                    href={`/admin/auftraege/${claim.id}`}
                    className="block p-4 active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {claim.kunde_vorname} {claim.kunde_nachname}
                        </p>
                        <p className="text-xs text-red-600 font-mono">{claim.auftragsnummer || '-'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusOption?.color || ''}`}>
                        {statusOption?.label || claim.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <p className="text-slate-500 text-xs">Kennzeichen</p>
                        <p className="font-medium truncate">{claim.kennzeichen || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Schadensart</p>
                        <p className="font-medium truncate">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</p>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </Link>
                  <div className="flex border-t border-slate-200 divide-x divide-slate-200">
                    <Link
                      href={`/admin/auftraege/${claim.id}`}
                      className="flex-1 py-3 flex items-center justify-center gap-2 text-slate-600 font-medium active:bg-slate-50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="text-sm">Bearbeiten</span>
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm({
                        show: true,
                        claimId: claim.id,
                        claimName: `${claim.kunde_vorname} ${claim.kunde_nachname}`,
                        auftragsnummer: claim.auftragsnummer || ''
                      })}
                      className="flex-1 py-3 flex items-center justify-center gap-2 text-red-600 font-medium active:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Löschen</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Desktop: Table */}
        {filteredClaims.length > 0 && (
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Auftragsnr.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Kunde</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Versicherung</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Werkstatt</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Schadensart</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Datum</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map((claim) => {
                    const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)
                    return (
                      <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-red-600">{claim.auftragsnummer || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{claim.kunde_vorname} {claim.kunde_nachname}</p>
                            <p className="text-sm text-muted">{claim.kennzeichen || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{claim.versicherung?.firma || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{claim.standort?.name || 'Nicht zugewiesen'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusSelect
                            options={STATUS_OPTIONS}
                            value={claim.status}
                            onChange={(value) => handleStatusChange(claim.id, value as ClaimStatus)}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/auftraege/${claim.id}`}
                              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                              title="Bearbeiten"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => setDeleteConfirm({
                                show: true,
                                claimId: claim.id,
                                claimName: `${claim.kunde_vorname} ${claim.kunde_nachname}`,
                                auftragsnummer: claim.auftragsnummer || ''
                              })}
                              className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                              title="In Papierkorb"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] md:p-6">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md overflow-hidden shadow-xl">
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>
            <div className="p-5 md:p-6 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 md:w-8 md:h-8 text-orange-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">In Papierkorb verschieben?</h3>
              <p className="text-sm md:text-base text-slate-600">
                Auftrag <span className="font-mono font-semibold text-red-600">{deleteConfirm.auftragsnummer}</span> von <span className="font-semibold">{deleteConfirm.claimName}</span> wird in den Papierkorb verschoben.
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setDeleteConfirm({ show: false, claimId: null, claimName: '', auftragsnummer: '' })}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200 active:bg-slate-50 md:hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-4 text-orange-600 font-semibold active:bg-orange-50 md:hover:bg-orange-50 transition-colors disabled:opacity-50"
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
