'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { ArrowLeft, Search, FileText, ChevronRight, Trash2 } from 'lucide-react'

interface Claim {
  id: string
  auftragsnummer: string
  kunde_vorname: string
  kunde_nachname: string
  kennzeichen: string | null
  schadensart: DamageType
  status: ClaimStatus
  created_at: string
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string; color: string }[] = [
  { value: 'neu', label: 'Neu', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-700' },
  { value: 'reparatur_abgeschlossen', label: 'Reparatur fertig', color: 'bg-purple-100 text-purple-700' },
  { value: 'abgeschlossen', label: 'Erledigt', color: 'bg-green-100 text-green-700' },
]

export default function WerkstattAuftraegePage() {
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
      loadClaims(werkstattData.id)
    }
  }

  async function loadClaims(werkstattId: string) {
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
      claim.auftragsnummer?.toLowerCase().includes(searchLower)
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link href="/werkstatt" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold text-base">Alle Aufträge</h1>
          <p className="text-xs text-slate-500">{claims.length} Aufträge</p>
        </div>
        <Link href="/werkstatt/papierkorb" className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-orange-600" />
        </Link>
      </header>

      <main className="flex-1 p-4 pb-8">
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

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setFilter('alle')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
              filter === 'alle' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Alle
          </button>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                filter === option.value ? option.color.replace('100', '500').replace('700', 'white') : option.color
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

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
                <Link
                  key={claim.id}
                  href={`/werkstatt/auftraege/${claim.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 block active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-xs text-orange-600 font-medium mb-1">{claim.auftragsnummer || '-'}</p>
                      <h3 className="font-semibold text-slate-900">{claim.kunde_vorname} {claim.kunde_nachname}</h3>
                      <p className="text-sm text-slate-500">{claim.kennzeichen || '-'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusOption?.color || ''}`}>
                      {statusOption?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</span>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>{new Date(claim.created_at).toLocaleDateString('de-DE')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
