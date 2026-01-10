'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { CLAIM_STATUS_LABELS, DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { ArrowLeft, User, Phone, Building2, Shield, Car, FileText, Edit3, Save, X, Check } from 'lucide-react'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'

interface Claim {
  id: string
  auftragsnummer: string
  versicherung_id: string
  werkstatt_standort_id: string | null
  werkstatt_name: string | null
  status: ClaimStatus
  kunde_vorname: string
  kunde_nachname: string
  kunde_telefon: string
  vers_name: string | null
  vers_nr: string | null
  selbstbeteiligung: number | null
  kennzeichen: string | null
  vin: string | null
  schaden_datum: string
  schadensart: DamageType
  beschreibung: string | null
  created_at: string
  updated_at: string
  standort?: {
    name: string
    adresse: string
  }
}

const STATUS_STYLES: Record<ClaimStatus, string> = {
  'neu': 'bg-amber-100 text-amber-700',
  'in_bearbeitung': 'bg-blue-100 text-blue-700',
  'reparatur_abgeschlossen': 'bg-purple-100 text-purple-700',
  'abgeschlossen': 'bg-emerald-100 text-emerald-700',
  'storniert': 'bg-red-100 text-red-700',
}

export default function VersicherungAuftragDetailPage() {
  const router = useRouter()
  const params = useParams()
  const claimId = params.id as string
  const supabase = getSupabaseClient()
  const { showSuccess, AnimationComponent } = useSuccessAnimation()

  const [claim, setClaim] = useState<Claim | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Claim>>({})

  useEffect(() => {
    loadClaim()
  }, [claimId])

  async function loadClaim() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Verify user is versicherung
    const { data: versicherung } = await supabase
      .from('versicherungen')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!versicherung) {
      router.push('/login')
      return
    }

    // Simplified query
    const { data: claimData, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .eq('versicherung_id', versicherung.id)
      .single()

    if (error || !claimData) {
      console.error('Error loading claim:', error)
      toast.error('Auftrag nicht gefunden')
      router.push('/versicherung')
      return
    }

    // Load standort data for address
    let standortData = null
    if (claimData.werkstatt_standort_id) {
      const { data: standort } = await supabase
        .from('werkstatt_standorte')
        .select('name, adresse')
        .eq('id', claimData.werkstatt_standort_id)
        .single()
      standortData = standort
    }

    setClaim({ ...claimData, standort: standortData } as Claim)
    setEditData(claimData)
    setIsLoading(false)
  }

  async function handleSave() {
    if (!claim) return

    setIsSaving(true)

    // VIN must be exactly 17 chars or null
    const vinValue = editData.vin && editData.vin.length === 17 ? editData.vin : null

    const { error } = await supabase
      .from('claims')
      .update({
        vers_nr: editData.vers_nr || '',
        selbstbeteiligung: editData.selbstbeteiligung || 0,
        kennzeichen: editData.kennzeichen || '',
        vin: vinValue,
        beschreibung: editData.beschreibung || '',
      })
      .eq('id', claim.id)

    if (error) {
      console.error('Save error:', error)
      toast.error('Fehler beim Speichern')
    } else {
      setClaim({ ...claim, ...editData, vin: vinValue } as Claim)
      setIsEditing(false)
      showSuccess('Änderungen gespeichert', 'purple')
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!claim) return null

  const statusStyle = STATUS_STYLES[claim.status] || ''

  return (
    <>
      {AnimationComponent}
      <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        <Link
          href="/versicherung/auftraege"
          className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg truncate">Auftrag Details</h1>
          <p className="text-xs text-slate-500 font-mono">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsEditing(false); setEditData(claim) }}
              className="h-10 px-3 rounded-xl bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <X className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Abbrechen</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 px-4 rounded-xl bg-purple-500 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">Speichern</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="h-10 px-4 rounded-xl bg-purple-500 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Edit3 className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Nachreichen</span>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-8 space-y-4">
        {/* Status & Customer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">{claim.kunde_vorname} {claim.kunde_nachname}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>
              {CLAIM_STATUS_LABELS[claim.status]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Phone className="w-4 h-4" />
            <span>{claim.kunde_telefon}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Erstellt am {new Date(claim.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Werkstatt */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-orange-900">Zugewiesene Werkstatt</span>
            </div>
          </div>
          <div className="p-4">
            {claim.werkstatt_name ? (
              <div>
                <p className="font-semibold text-slate-900">{claim.werkstatt_name}</p>
                {claim.standort?.adresse && (
                  <p className="text-sm text-slate-500 mt-1">{claim.standort.adresse}</p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Keine Werkstatt zugewiesen</p>
            )}
          </div>
        </div>

        {/* Versicherungsdaten */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">Versicherungsdaten</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Versicherung des Kunden</label>
              <p className="font-medium text-slate-900">{claim.vers_name || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Vers.-Nr.</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.vers_nr || ''}
                    onChange={(e) => setEditData({ ...editData, vers_nr: e.target.value })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                ) : (
                  <p className="font-medium text-slate-900">{claim.vers_nr || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Selbstbeteiligung</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.selbstbeteiligung || ''}
                    onChange={(e) => setEditData({ ...editData, selbstbeteiligung: parseFloat(e.target.value) || null })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    placeholder="0.00"
                  />
                ) : (
                  <p className="font-medium text-slate-900">{claim.selbstbeteiligung ? `${claim.selbstbeteiligung.toFixed(2)} EUR` : '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fahrzeugdaten */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-900">Fahrzeugdaten</span>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Kennzeichen</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.kennzeichen || ''}
                    onChange={(e) => setEditData({ ...editData, kennzeichen: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    placeholder="M-AB 1234"
                  />
                ) : (
                  <p className="font-medium text-slate-900">{claim.kennzeichen || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">VIN</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.vin || ''}
                    onChange={(e) => setEditData({ ...editData, vin: e.target.value.toUpperCase().replace(/[IOQ]/g, '') })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    maxLength={17}
                  />
                ) : (
                  <p className="font-medium font-mono text-sm text-slate-900">{claim.vin || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schadensdetails */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-900">Schadensdetails</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Schadensart</label>
                <p className="font-medium text-slate-900">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Schadensdatum</label>
                <p className="font-medium text-slate-900">{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Beschreibung</label>
              {isEditing ? (
                <textarea
                  value={editData.beschreibung || ''}
                  onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value })}
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all min-h-[80px] resize-none"
                  placeholder="Beschreibung..."
                />
              ) : (
                <p className="text-sm text-slate-600">{claim.beschreibung || 'Keine Beschreibung vorhanden'}</p>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  )
}
