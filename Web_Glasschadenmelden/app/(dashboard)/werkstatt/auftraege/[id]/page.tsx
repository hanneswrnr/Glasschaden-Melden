'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { CLAIM_STATUS_LABELS, DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { StatusSelect } from '@/components/shared/StatusSelect'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { ChatContainer } from '@/components/shared/Chat'
import { ArrowLeft, User, Phone, Shield, Car, FileText, Edit3, Check, X, ChevronDown, Printer, Trash2 } from 'lucide-react'

// Map status to animation color
const STATUS_COLOR_MAP: Record<ClaimStatus, string> = {
  neu: 'neu',
  in_bearbeitung: 'in_bearbeitung',
  reparatur_abgeschlossen: 'reparatur_abgeschlossen',
  abgeschlossen: 'abgeschlossen',
  storniert: 'red',
}

interface Claim {
  id: string
  auftragsnummer: string
  versicherung_id: string
  werkstatt_standort_id: string | null
  werkstatt_name: string | null
  vermittler_firma: string | null
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
  completed_at: string | null
  standort?: {
    name: string
    adresse: string
    ansprechpartner: string
    telefon: string
  }
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string; color: string }[] = [
  { value: 'neu', label: 'Neu', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'reparatur_abgeschlossen', label: 'Reparatur abgeschlossen', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'abgeschlossen', label: 'Erledigt', color: 'bg-green-100 text-green-700 border-green-200' },
]

export default function AuftragDetailPage() {
  const router = useRouter()
  const params = useParams()
  const claimId = params.id as string
  const supabase = getSupabaseClient()
  const { showSuccess, showStatus, AnimationComponent } = useSuccessAnimation()

  const [claim, setClaim] = useState<Claim | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [editData, setEditData] = useState<Partial<Claim>>({})
  const [standortIds, setStandortIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    loadClaim()
  }, [claimId])

  async function loadClaim() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Store user ID for chat
    setUserId(user.id)

    // Get user's werkstatt and standorte
    const { data: werkstatt } = await supabase
      .from('werkstaetten')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!werkstatt) {
      router.push('/login')
      return
    }

    const { data: standorte } = await supabase
      .from('werkstatt_standorte')
      .select('id')
      .eq('werkstatt_id', werkstatt.id)

    const userStandortIds = standorte?.map(s => s.id) || []
    setStandortIds(userStandortIds)

    // Load claim with versicherung info
    const { data: claimData, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single()

    if (error || !claimData) {
      toast.error('Auftrag nicht gefunden')
      router.push('/werkstatt')
      return
    }

    // Verify werkstatt has access to this claim
    if (claimData.werkstatt_standort_id && !userStandortIds.includes(claimData.werkstatt_standort_id)) {
      toast.error('Kein Zugriff auf diesen Auftrag')
      router.push('/werkstatt')
      return
    }

    // Load standort data if available
    let standortData = null
    if (claimData.werkstatt_standort_id) {
      const { data: standort } = await supabase
        .from('werkstatt_standorte')
        .select('name, adresse, ansprechpartner, telefon')
        .eq('id', claimData.werkstatt_standort_id)
        .single()
      standortData = standort
    }

    setClaim({ ...claimData, standort: standortData } as Claim)
    setEditData(claimData)
    setIsLoading(false)
  }

  async function handleStatusChange(newStatus: ClaimStatus) {
    if (!claim) return

    setIsSaving(true)

    // Build update query - only update if werkstatt has access
    let updateQuery = supabase
      .from('claims')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', claim.id)

    // Add standort filter if claim has one and user has standorte
    if (claim.werkstatt_standort_id && standortIds.length > 0) {
      updateQuery = updateQuery.in('werkstatt_standort_id', standortIds)
    }

    const { error, data } = await updateQuery.select()

    if (error) {
      console.error('Status update error:', error)
      toast.error('Fehler beim Ändern des Status')
    } else if (!data || data.length === 0) {
      toast.error('Keine Berechtigung für diese Änderung')
    } else {
      setClaim({ ...claim, status: newStatus })
      showStatus(CLAIM_STATUS_LABELS[newStatus], STATUS_COLOR_MAP[newStatus])
    }
    setIsSaving(false)
    setShowStatusPicker(false)
  }

  async function handleSave() {
    if (!claim) return

    setIsSaving(true)

    // VIN must be exactly 17 chars or null
    const vinValue = editData.vin && editData.vin.length === 17 ? editData.vin : null

    const { error } = await supabase
      .from('claims')
      .update({
        kunde_vorname: editData.kunde_vorname,
        kunde_nachname: editData.kunde_nachname,
        kunde_telefon: editData.kunde_telefon,
        vers_name: editData.vers_name,
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
      showSuccess('Änderungen gespeichert')
    }
    setIsSaving(false)
  }

  function handlePrintPDF() {
    // Simple print functionality - opens browser print dialog
    window.print()
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
        router.push('/werkstatt/auftraege')
      }, 1500)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 md:bg-gradient-subtle flex items-center justify-center">
        <div className="md:hidden w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <div className="hidden md:block spinner" />
      </div>
    )
  }

  if (!claim) return null

  const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-slate-50 md:bg-gradient-subtle flex flex-col print:bg-white print:min-h-0">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/werkstatt/auftraege"
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-semibold text-base">Auftrag Details</h1>
            <p className="text-xs text-slate-500 font-mono truncate">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => { setIsEditing(false); setEditData(claim) }}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              >
                <Check className="w-5 h-5 text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePrintPDF}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Printer className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Edit3 className="w-5 h-5 text-orange-600" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block navbar sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/werkstatt/auftraege"
              className="btn-icon"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Auftrag Details</h1>
              <p className="text-sm text-muted font-mono">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrintPDF} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Drucken
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-secondary text-orange-600 hover:bg-orange-50 border-orange-200">
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

      {/* Print Header - nur beim Drucken sichtbar */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">GlasschadenMelden</h1>
            <p className="text-sm text-slate-600">Auftragsbeleg</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-orange-600">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
            <p className="text-sm text-slate-600">
              {new Date(claim.created_at).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 pb-8 md:max-w-5xl md:mx-auto md:px-6 md:py-8 print:px-0 print:py-0">
        {/* Mobile Status Card */}
        <div className="md:hidden bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4 print:hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">{claim.kunde_vorname} {claim.kunde_nachname}</h2>
            <p className="text-sm text-slate-500">
              Erstellt am {new Date(claim.created_at).toLocaleDateString('de-DE')}
            </p>
          </div>
          <div className="p-4">
            <button
              onClick={() => setShowStatusPicker(!showStatusPicker)}
              disabled={isSaving}
              className={`w-full px-4 py-3 rounded-xl flex items-center justify-between ${statusOption?.color || 'bg-slate-100'} active:opacity-80 transition-opacity`}
            >
              <span className="font-semibold">{statusOption?.label}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${showStatusPicker ? 'rotate-180' : ''}`} />
            </button>
            {showStatusPicker && (
              <div className="mt-2 space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full px-4 py-3 rounded-xl text-left font-medium ${option.color} ${claim.status === option.value ? 'ring-2 ring-offset-2 ring-orange-500' : ''} active:opacity-80 transition-opacity`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Status Bar */}
        <div className="hidden md:block card p-6 mb-6 print:shadow-none print:border overflow-visible relative z-10">
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
            <div className="flex items-center gap-3 print:hidden">
              <span className="text-sm font-medium text-muted">Status:</span>
              <StatusSelect
                options={STATUS_OPTIONS}
                value={claim.status}
                onChange={(value) => handleStatusChange(value as ClaimStatus)}
                disabled={isSaving}
              />
            </div>
            <div className="print:block hidden">
              <span className={`px-4 py-2 rounded-xl border font-medium text-sm ${statusOption?.color || ''}`}>
                {statusOption?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Data Cards */}
        <div className="md:hidden space-y-4">
          {/* Kundendaten Mobile */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-sm text-slate-900">Kundendaten</span>
            </div>
            <div className="p-4 space-y-3">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Vorname</label>
                      <input
                        type="text"
                        value={editData.kunde_vorname || ''}
                        onChange={(e) => setEditData({ ...editData, kunde_vorname: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Nachname</label>
                      <input
                        type="text"
                        value={editData.kunde_nachname || ''}
                        onChange={(e) => setEditData({ ...editData, kunde_nachname: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Telefon</label>
                    <input
                      type="tel"
                      value={editData.kunde_telefon || ''}
                      onChange={(e) => setEditData({ ...editData, kunde_telefon: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{claim.kunde_vorname} {claim.kunde_nachname}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${claim.kunde_telefon}`} className="text-sm text-orange-600">{claim.kunde_telefon}</a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Versicherungsdaten Mobile */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-sm text-slate-900">Versicherung</span>
            </div>
            <div className="p-4 space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Versicherung</label>
                    <input
                      type="text"
                      value={editData.vers_name || ''}
                      onChange={(e) => setEditData({ ...editData, vers_name: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Vers.-Nr.</label>
                      <input
                        type="text"
                        value={editData.vers_nr || ''}
                        onChange={(e) => setEditData({ ...editData, vers_nr: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Selbstbet.</label>
                      <input
                        type="number"
                        value={editData.selbstbeteiligung || ''}
                        onChange={(e) => setEditData({ ...editData, selbstbeteiligung: parseFloat(e.target.value) || null })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Kundenversicherung</span>
                    <span className="text-sm font-medium">{claim.vers_name || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Vers.-Nr.</span>
                    <span className="text-sm">{claim.vers_nr || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Selbstbeteiligung</span>
                    <span className="text-sm">{claim.selbstbeteiligung ? `${claim.selbstbeteiligung.toFixed(2)} EUR` : '-'}</span>
                  </div>
                </>
              )}
              {claim.vermittler_firma && (
                <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs font-medium text-purple-700 mb-1">Vermittelt durch</p>
                  <p className="text-sm font-semibold text-purple-900">{claim.vermittler_firma}</p>
                </div>
              )}
              {claim.standort && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs font-medium text-green-700 mb-1">Vermittelt an Standort</p>
                  <p className="text-sm font-semibold text-green-900">{claim.standort.name}</p>
                  <p className="text-xs text-green-700">{claim.standort.adresse}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fahrzeugdaten Mobile */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Car className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-sm text-slate-900">Fahrzeug</span>
            </div>
            <div className="p-4 space-y-3">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Kennzeichen</label>
                    <input
                      type="text"
                      value={editData.kennzeichen || ''}
                      onChange={(e) => setEditData({ ...editData, kennzeichen: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">VIN</label>
                    <input
                      type="text"
                      value={editData.vin || ''}
                      onChange={(e) => setEditData({ ...editData, vin: e.target.value.toUpperCase().replace(/[IOQ]/g, '') })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm"
                      maxLength={17}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Kennzeichen</span>
                    <span className="text-sm font-medium">{claim.kennzeichen || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">VIN</span>
                    <span className="text-sm font-mono">{claim.vin || '-'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Schadensdetails Mobile */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-sm text-slate-900">Schadensdetails</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Schadensart</span>
                <span className="text-sm font-medium">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Schadensdatum</span>
                <span className="text-sm">{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</span>
              </div>
              {isEditing ? (
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Beschreibung</label>
                  <textarea
                    value={editData.beschreibung || ''}
                    onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 text-slate-900 text-sm min-h-[80px] resize-none"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Beschreibung</p>
                  <p className="text-sm text-slate-700">{claim.beschreibung || 'Keine Beschreibung'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section Mobile */}
          <div className="mt-4">
            <ChatContainer
              claimId={claim.id}
              currentUserId={userId}
              userRole="werkstatt"
              completedAt={claim.completed_at}
              isReadOnly={claim.status === 'abgeschlossen'}
            />
          </div>
        </div>

        {/* Desktop Data Cards Grid */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kundendaten */}
          <div className="card p-6 print:shadow-none print:border">
            <h3 className="heading-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Kundendaten
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Vorname</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.kunde_vorname || ''}
                      onChange={(e) => setEditData({ ...editData, kunde_vorname: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="font-medium">{claim.kunde_vorname}</p>
                  )}
                </div>
                <div>
                  <label className="input-label">Nachname</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.kunde_nachname || ''}
                      onChange={(e) => setEditData({ ...editData, kunde_nachname: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="font-medium">{claim.kunde_nachname}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="input-label">Telefon</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.kunde_telefon || ''}
                    onChange={(e) => setEditData({ ...editData, kunde_telefon: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{claim.kunde_telefon}</p>
                )}
              </div>
            </div>
          </div>

          {/* Versicherungsdaten */}
          <div className="card p-6 print:shadow-none print:border">
            <h3 className="heading-3 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Versicherungsdaten
            </h3>
            <div className="space-y-4">
              <div>
                <label className="input-label">Versicherung des Kunden</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.vers_name || ''}
                    onChange={(e) => setEditData({ ...editData, vers_name: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{claim.vers_name || '-'}</p>
                )}
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
              {claim.vermittler_firma && (
                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-xs font-medium text-purple-600 mb-2">Vermittelt durch</p>
                  <p className="font-semibold text-purple-700">{claim.vermittler_firma}</p>
                </div>
              )}
              {claim.standort && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-2">Vermittelt an Standort</p>
                  <p className="font-semibold text-green-700">{claim.standort.name}</p>
                  <p className="text-sm text-green-600">{claim.standort.adresse}</p>
                  <p className="text-sm text-green-600">{claim.standort.ansprechpartner} • {claim.standort.telefon}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fahrzeugdaten */}
          <div className="card p-6 print:shadow-none print:border">
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
          <div className="card p-6 print:shadow-none print:border">
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

        {/* Chat Section */}
        <div className="mt-6 print:hidden">
          <ChatContainer
            claimId={claim.id}
            currentUserId={userId}
            userRole="werkstatt"
            completedAt={claim.completed_at}
            isReadOnly={claim.status === 'abgeschlossen'}
          />
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 12px;
          }
          * {
            background: white !important;
            box-shadow: none !important;
          }
          .min-h-screen {
            min-height: 0 !important;
            background: white !important;
          }
          .navbar, header.navbar, .sticky {
            display: none !important;
          }
          main {
            padding: 0 !important;
            max-width: none !important;
          }
          .card, .print\\:shadow-none {
            box-shadow: none !important;
            border: 1px solid #d1d5db !important;
            margin-bottom: 8px !important;
            padding: 12px !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .grid {
            display: block !important;
          }
          .grid > div {
            margin-bottom: 8px !important;
          }
          .lg\\:grid-cols-2 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          h3.heading-3 {
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }
          .space-y-4 > * + * {
            margin-top: 8px !important;
          }
          .mb-6 {
            margin-bottom: 8px !important;
          }
          p, span, label {
            font-size: 11px !important;
          }
          .text-xl {
            font-size: 16px !important;
          }
          .p-6 {
            padding: 10px !important;
          }
        }
      `}</style>

      {/* Trash Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] md:p-6">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 md:w-8 md:h-8 text-orange-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">In Papierkorb verschieben?</h3>
              <p className="text-sm md:text-base text-slate-600">
                Auftrag <span className="font-mono font-semibold text-orange-600">{claim.auftragsnummer}</span> von <span className="font-semibold">{claim.kunde_vorname} {claim.kunde_nachname}</span> wird in den Papierkorb verschoben. Du kannst ihn dort wiederherstellen oder endgültig löschen.
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200 active:bg-slate-50 md:hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleMoveToTrash}
                disabled={isDeleting}
                className="flex-1 py-4 text-orange-600 font-semibold active:bg-orange-50 md:hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Verschieben...' : 'Papierkorb'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
