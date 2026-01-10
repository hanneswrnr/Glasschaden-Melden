'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { CLAIM_STATUS_LABELS, DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
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
  'neu': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'in_bearbeitung': 'bg-blue-100 text-blue-700 border-blue-200',
  'reparatur_abgeschlossen': 'bg-purple-100 text-purple-700 border-purple-200',
  'abgeschlossen': 'bg-green-100 text-green-700 border-green-200',
  'storniert': 'bg-red-100 text-red-700 border-red-200',
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
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!claim) return null

  const statusStyle = STATUS_STYLES[claim.status] || ''

  return (
    <>
      {AnimationComponent}
      <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="navbar sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/versicherung/auftraege"
              className="btn-icon"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Auftragsdetails</h1>
              <p className="text-sm text-muted font-mono">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button onClick={() => { setIsEditing(false); setEditData(claim) }} className="btn-secondary">
                  Abbrechen
                </button>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                  {isSaving ? 'Speichern...' : 'Speichern'}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Daten nachreichen
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Status Bar */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">{claim.kunde_vorname} {claim.kunde_nachname}</h2>
              <p className="text-muted">
                Erstellt am {new Date(claim.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted">Status:</span>
              <span className={`px-4 py-2 rounded-xl border font-medium text-sm ${statusStyle}`}>
                {CLAIM_STATUS_LABELS[claim.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kundendaten */}
          <div className="card p-6">
            <h3 className="heading-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Kundendaten
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Vorname</label>
                  <p className="font-medium">{claim.kunde_vorname}</p>
                </div>
                <div>
                  <label className="input-label">Nachname</label>
                  <p className="font-medium">{claim.kunde_nachname}</p>
                </div>
              </div>
              <div>
                <label className="input-label">Telefon</label>
                <p className="font-medium">{claim.kunde_telefon}</p>
              </div>
            </div>
          </div>

          {/* Werkstatt Info */}
          <div className="card p-6">
            <h3 className="heading-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Zugewiesene Werkstatt
            </h3>
            {claim.werkstatt_name ? (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <p className="font-semibold text-orange-700">{claim.werkstatt_name}</p>
                {claim.standort?.adresse && (
                  <p className="text-sm text-orange-600 mt-1">{claim.standort.adresse}</p>
                )}
              </div>
            ) : (
              <p className="text-muted">Keine Werkstatt zugewiesen</p>
            )}
          </div>

          {/* Versicherungsdaten */}
          <div className="card p-6">
            <h3 className="heading-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Versicherungsdaten
            </h3>
            <div className="space-y-4">
              <div>
                <label className="input-label">Versicherung des Kunden</label>
                <p className="font-medium">{claim.vers_name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Vers.-Nr.</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.vers_nr || ''}
                      onChange={(e) => setEditData({ ...editData, vers_nr: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="font-medium">{claim.vers_nr || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="input-label">Selbstbeteiligung</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.selbstbeteiligung || ''}
                      onChange={(e) => setEditData({ ...editData, selbstbeteiligung: parseFloat(e.target.value) || null })}
                      className="input"
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="font-medium">{claim.selbstbeteiligung ? `${claim.selbstbeteiligung.toFixed(2)} EUR` : '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fahrzeugdaten */}
          <div className="card p-6">
            <h3 className="heading-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h4M8 11h4m-4 4h4m4-8h.01M16 11h.01M16 15h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Fahrzeugdaten
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Kennzeichen</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.kennzeichen || ''}
                      onChange={(e) => setEditData({ ...editData, kennzeichen: e.target.value.toUpperCase() })}
                      className="input"
                      placeholder="M-AB 1234"
                    />
                  ) : (
                    <p className="font-medium">{claim.kennzeichen || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="input-label">VIN / Fahrgestellnr.</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.vin || ''}
                      onChange={(e) => setEditData({ ...editData, vin: e.target.value.toUpperCase().replace(/[IOQ]/g, '') })}
                      className="input"
                      maxLength={17}
                    />
                  ) : (
                    <p className="font-medium font-mono text-sm">{claim.vin || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Schadensdetails */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="heading-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Schadensdetails
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Schadensart</label>
                  <p className="font-medium">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</p>
                </div>
                <div>
                  <label className="input-label">Schadensdatum</label>
                  <p className="font-medium">{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</p>
                </div>
              </div>
              <div>
                <label className="input-label">Beschreibung</label>
                {isEditing ? (
                  <textarea
                    value={editData.beschreibung || ''}
                    onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Beschreibung des Schadens..."
                  />
                ) : (
                  <p className="text-muted">{claim.beschreibung || 'Keine Beschreibung vorhanden'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  )
}
