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
  versicherung_id: string
  werkstatt_standort_id: string | null
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
  versicherung?: {
    firma: string
    ansprechpartner: string
    email: string
    telefon: string
  }
  standort?: {
    name: string
    adresse: string
  }
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string; color: string }[] = [
  { value: 'neu', label: 'Neu', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-700' },
  { value: 'reparatur_abgeschlossen', label: 'Reparatur fertig', color: 'bg-purple-100 text-purple-700' },
  { value: 'abgeschlossen', label: 'Erledigt', color: 'bg-green-100 text-green-700' },
]

export default function AdminAuftragDetailPage() {
  const router = useRouter()
  const params = useParams()
  const claimId = params.id as string
  const supabase = getSupabaseClient()
  const { showSuccess, showStatus, AnimationComponent } = useSuccessAnimation()

  const [claim, setClaim] = useState<Claim | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Claim>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [claimId])

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

    loadClaim()
  }

  async function loadClaim() {
    const { data: claimData, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single()

    if (error || !claimData) {
      toast.error('Auftrag nicht gefunden')
      router.push('/admin/auftraege')
      return
    }

    setClaim(claimData as Claim)
    setEditData(claimData)
    setIsLoading(false)
  }

  async function handleStatusChange(newStatus: ClaimStatus) {
    if (!claim) return

    setIsSaving(true)
    const { error } = await supabase
      .from('claims')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', claim.id)

    if (error) {
      toast.error('Fehler beim Aktualisieren')
    } else {
      setClaim({ ...claim, status: newStatus })
      showStatus(CLAIM_STATUS_LABELS[newStatus], newStatus)
    }
    setIsSaving(false)
  }

  async function handleSave() {
    if (!claim) return

    setIsSaving(true)
    const { error } = await supabase
      .from('claims')
      .update({
        kunde_vorname: editData.kunde_vorname,
        kunde_nachname: editData.kunde_nachname,
        kunde_telefon: editData.kunde_telefon,
        vers_name: editData.vers_name,
        vers_nr: editData.vers_nr,
        selbstbeteiligung: editData.selbstbeteiligung,
        kennzeichen: editData.kennzeichen,
        vin: editData.vin,
        beschreibung: editData.beschreibung,
        updated_at: new Date().toISOString()
      })
      .eq('id', claim.id)

    if (error) {
      toast.error('Fehler beim Speichern')
    } else {
      setClaim({ ...claim, ...editData } as Claim)
      setIsEditing(false)
      showSuccess('Gespeichert', 'green')
    }
    setIsSaving(false)
  }

  async function handleMoveToTrash() {
    if (!claim) return

    setIsDeleting(true)
    const { error } = await supabase.rpc('soft_delete_claim', { claim_uuid: claim.id })

    if (error) {
      console.error('Soft delete error:', error)
      toast.error('Fehler beim Verschieben in den Papierkorb')
      setIsDeleting(false)
    } else {
      showSuccess('In den Papierkorb verschoben', 'orange')
      setTimeout(() => {
        router.push('/admin/auftraege')
      }, 1500)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!claim) return null

  const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="navbar sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/auftraege" className="btn-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Auftrag Details</h1>
              <p className="text-sm text-muted">#{claim.id.slice(0, 8)} - Admin-Ansicht</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary text-orange-600 hover:bg-orange-50 border-orange-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Papierkorb
            </button>
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
                Bearbeiten
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-3">Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusOption?.color || ''}`}>
                  {statusOption?.label}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      claim.status === option.value
                        ? 'ring-2 ring-red-500 ring-offset-2'
                        : ''
                    } ${option.color}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Data */}
            <div className="card p-6">
              <h2 className="heading-3 mb-4">Kundendaten</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Vorname</label>
                      <input
                        type="text"
                        value={editData.kunde_vorname || ''}
                        onChange={(e) => setEditData({ ...editData, kunde_vorname: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="input-label">Nachname</label>
                      <input
                        type="text"
                        value={editData.kunde_nachname || ''}
                        onChange={(e) => setEditData({ ...editData, kunde_nachname: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Telefon</label>
                    <input
                      type="tel"
                      value={editData.kunde_telefon || ''}
                      onChange={(e) => setEditData({ ...editData, kunde_telefon: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Name</span>
                    <span className="font-medium">{claim.kunde_vorname} {claim.kunde_nachname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Telefon</span>
                    <a href={`tel:${claim.kunde_telefon}`} className="text-primary-600">{claim.kunde_telefon}</a>
                  </div>
                </div>
              )}
            </div>

            {/* Insurance Data */}
            <div className="card p-6">
              <h2 className="heading-3 mb-4">Versicherungsdaten</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="input-label">Kundenversicherung</label>
                    <input
                      type="text"
                      value={editData.vers_name || ''}
                      onChange={(e) => setEditData({ ...editData, vers_name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Vers.-Nr.</label>
                      <input
                        type="text"
                        value={editData.vers_nr || ''}
                        onChange={(e) => setEditData({ ...editData, vers_nr: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="input-label">Selbstbeteiligung</label>
                      <input
                        type="number"
                        value={editData.selbstbeteiligung || ''}
                        onChange={(e) => setEditData({ ...editData, selbstbeteiligung: parseFloat(e.target.value) || null })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Kundenversicherung</span>
                    <span className="font-medium">{claim.vers_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Vers.-Nr.</span>
                    <span>{claim.vers_nr || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Selbstbeteiligung</span>
                    <span>{claim.selbstbeteiligung ? `${claim.selbstbeteiligung.toFixed(2)} EUR` : '-'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Data */}
            <div className="card p-6">
              <h2 className="heading-3 mb-4">Fahrzeugdaten</h2>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Kennzeichen</label>
                    <input
                      type="text"
                      value={editData.kennzeichen || ''}
                      onChange={(e) => setEditData({ ...editData, kennzeichen: e.target.value.toUpperCase() })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="input-label">VIN</label>
                    <input
                      type="text"
                      value={editData.vin || ''}
                      onChange={(e) => setEditData({ ...editData, vin: e.target.value.toUpperCase().replace(/[IOQ]/g, '') })}
                      className="input"
                      maxLength={17}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Kennzeichen</span>
                    <span className="font-medium">{claim.kennzeichen || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">VIN</span>
                    <span className="font-mono">{claim.vin || '-'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Damage Details */}
            <div className="card p-6">
              <h2 className="heading-3 mb-4">Schadensdetails</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted">Schadensart</span>
                  <span className="font-medium">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Schadensdatum</span>
                  <span>{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</span>
                </div>
                {isEditing ? (
                  <div>
                    <label className="input-label">Beschreibung</label>
                    <textarea
                      value={editData.beschreibung || ''}
                      onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value })}
                      className="input min-h-[100px]"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-muted mb-1">Beschreibung</p>
                    <p>{claim.beschreibung || 'Keine Beschreibung'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vermittler Info */}
            {claim.versicherung && (
              <div className="card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Vermittler
                </h3>
                <div className="space-y-2">
                  <p className="font-semibold">{claim.versicherung.firma}</p>
                  <p className="text-sm text-muted">{claim.versicherung.ansprechpartner}</p>
                  <p className="text-sm">{claim.versicherung.email}</p>
                  <p className="text-sm">{claim.versicherung.telefon}</p>
                </div>
              </div>
            )}

            {/* Werkstatt Info */}
            {claim.standort && (
              <div className="card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Werkstatt-Standort
                </h3>
                <div className="space-y-2">
                  <p className="font-semibold">{claim.standort.name}</p>
                  <p className="text-sm text-muted">{claim.standort.adresse}</p>
                </div>
              </div>
            )}

            {/* Meta Info */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Metadaten</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Erstellt</span>
                  <span>{new Date(claim.created_at).toLocaleString('de-DE')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Aktualisiert</span>
                  <span>{new Date(claim.updated_at).toLocaleString('de-DE')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">ID</span>
                  <span className="font-mono text-xs">{claim.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Move to Trash Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">In Papierkorb verschieben?</h3>
              <p className="text-slate-600">
                Auftrag <span className="font-mono font-semibold text-red-600">{claim.auftragsnummer}</span> von <span className="font-semibold">{claim.kunde_vorname} {claim.kunde_nachname}</span> wird in den Papierkorb verschoben. Du kannst ihn dort wiederherstellen oder endgültig löschen.
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleMoveToTrash}
                disabled={isDeleting}
                className="flex-1 py-4 text-orange-600 font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
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
