'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, CLAIM_STATUS_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'

interface Claim {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  schadensart: DamageType
  status: ClaimStatus
  created_at: string
  werkstatt_name: string | null
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string; color: string }[] = [
  { value: 'neu', label: 'Neu', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-700' },
  { value: 'reparatur_abgeschlossen', label: 'Reparatur fertig', color: 'bg-purple-100 text-purple-700' },
  { value: 'abgeschlossen', label: 'Erledigt', color: 'bg-green-100 text-green-700' },
]

export default function VersicherungAuftraegePage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'alle' | ClaimStatus>('alle')
  const [searchTerm, setSearchTerm] = useState('')

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

    if (!profile || profile.role !== 'versicherung') {
      router.push('/login')
      return
    }

    const { data: versicherungData } = await supabase
      .from('versicherungen')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (versicherungData) {
      loadClaims(versicherungData.id)
    }
  }

  async function loadClaims(versicherungId: string) {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('versicherung_id', versicherungId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Fehler beim Laden')
    } else {
      setClaims(data || [])
    }
    setIsLoading(false)
  }

  const filteredClaims = claims.filter(claim => {
    const matchesFilter = filter === 'alle' || claim.status === filter
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = searchTerm === '' ||
      claim.kunde_vorname.toLowerCase().includes(searchLower) ||
      claim.kunde_nachname.toLowerCase().includes(searchLower) ||
      claim.kennzeichen?.toLowerCase().includes(searchLower) ||
      claim.werkstatt_name?.toLowerCase().includes(searchLower) ||
      claim.auftragsnummer?.toLowerCase().includes(searchLower)
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="navbar sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/versicherung" className="btn-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Alle Aufträge</h1>
              <p className="text-sm text-muted">{claims.length} Aufträge</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-medium">Versicherung</span>
            <Link href="/versicherung/schaden-melden" className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Neuer Schaden
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filter */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Suche nach Name, Kennzeichen, Werkstatt, Auftragsnummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
            </div>
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('alle')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === 'alle'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Alle
              </button>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === option.value
                      ? option.color.replace('100', '500').replace('700', 'white')
                      : option.color
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="card overflow-hidden">
          {filteredClaims.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-muted">Keine Aufträge gefunden</p>
              <p className="text-sm text-slate-400 mt-1">Versuchen Sie eine andere Suche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Auftragsnr.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Kunde</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Kennzeichen</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Werkstatt</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Schadensart</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Datum</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map((claim) => {
                    const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)
                    return (
                      <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-purple-600">{claim.auftragsnummer || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{claim.kunde_vorname} {claim.kunde_nachname}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{claim.kennzeichen || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{claim.werkstatt_name || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusOption?.color || ''}`}>
                            {statusOption?.label || claim.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-500">{new Date(claim.created_at).toLocaleDateString('de-DE')}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/versicherung/auftraege/${claim.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition-colors"
                          >
                            Details
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
