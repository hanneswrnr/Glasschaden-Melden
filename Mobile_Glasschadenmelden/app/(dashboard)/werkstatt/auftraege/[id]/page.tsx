'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { CLAIM_STATUS_LABELS, DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { ArrowLeft, User, Phone, Shield, Car, Calendar, FileText, Building2, Edit3, Check, X, ChevronDown, Printer, MapPin, Trash2 } from 'lucide-react'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { ChatContainer } from '@/components/shared/Chat'

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
  { value: 'neu', label: 'Neu', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-700' },
  { value: 'reparatur_abgeschlossen', label: 'Reparatur abgeschlossen', color: 'bg-purple-100 text-purple-700' },
  { value: 'abgeschlossen', label: 'Erledigt', color: 'bg-green-100 text-green-700' },
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

    // Verify werkstatt has access
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

    // Build update query
    // Set completed_at when status changes to 'abgeschlossen', reset to null otherwise
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      completed_at: newStatus === 'abgeschlossen' ? new Date().toISOString() : null
    }
    let updateQuery = supabase
      .from('claims')
      .update(updateData)
      .eq('id', claim.id)

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
      setClaim({
        ...claim,
        status: newStatus,
        completed_at: newStatus === 'abgeschlossen' ? new Date().toISOString() : null
      })
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
      showSuccess('Gespeichert')
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
        router.push('/werkstatt/auftraege')
      }, 1500)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!claim) return null

  const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)

  function handlePrint() {
    window.print()
  }

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white print:min-h-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/werkstatt/auftraege"
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="font-semibold text-base">Auftrag Details</h1>
            <p className="text-xs text-orange-600 font-mono">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
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
                onClick={handlePrint}
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

      {/* Print Header - only visible when printing */}
      <div className="hidden print:block p-4 border-b-2 border-slate-300">
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

      {/* Main Content */}
      <main className="flex-1 p-4 pb-8 space-y-4 print:p-0 print:space-y-2">
        {/* Customer & Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden print:rounded-none print:border-0 print:border-b print:break-inside-avoid">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">{claim.kunde_vorname} {claim.kunde_nachname}</h2>
            <p className="text-sm text-slate-500">
              Erstellt am {new Date(claim.created_at).toLocaleDateString('de-DE')}
            </p>
          </div>

          {/* Status Picker */}
          <div className="p-4 print:hidden">
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
          {/* Print Status */}
          <div className="hidden print:block p-4">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusOption?.color || ''}`}>
              Status: {statusOption?.label}
            </span>
          </div>
        </div>

        {/* Kundendaten */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden print:rounded-none print:border-0 print:border-b print:break-inside-avoid">
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

        {/* Versicherungsdaten */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden print:rounded-none print:border-0 print:border-b print:break-inside-avoid">
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

        {/* Fahrzeugdaten */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden print:rounded-none print:border-0 print:border-b print:break-inside-avoid">
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

        {/* Schadensdetails */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden print:rounded-none print:border-0 print:border-b print:break-inside-avoid">
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
              <div className="print:hidden">
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

        {/* Chat Section */}
        <div className="print:hidden">
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
            font-size: 11px;
          }
          * {
            background: white !important;
            box-shadow: none !important;
          }
          .min-h-screen {
            min-height: 0 !important;
          }
          nav, header, .sticky, [class*="fixed"] {
            position: static !important;
          }
          header.bg-white, header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            flex: none !important;
          }
          main > div {
            border: 1px solid #d1d5db !important;
            border-radius: 0 !important;
            margin-bottom: 6px !important;
            padding: 8px !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .rounded-2xl {
            border-radius: 0 !important;
          }
          .space-y-4 > * + * {
            margin-top: 6px !important;
          }
          .space-y-3 > * + * {
            margin-top: 4px !important;
          }
          .p-4 {
            padding: 8px !important;
          }
          .px-4 {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .py-3 {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }
          .text-lg {
            font-size: 14px !important;
          }
          .text-sm {
            font-size: 10px !important;
          }
          .text-xs {
            font-size: 9px !important;
          }
          .hidden.print\\:block {
            display: block !important;
          }
        }
      `}</style>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">In Papierkorb verschieben?</h3>
              <p className="text-sm text-slate-600">
                Auftrag <span className="font-mono font-semibold text-orange-600">{claim.auftragsnummer}</span> von <span className="font-semibold">{claim.kunde_vorname} {claim.kunde_nachname}</span> wird in den Papierkorb verschoben. Du kannst ihn dort wiederherstellen oder endgültig löschen.
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200 active:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleMoveToTrash}
                disabled={isDeleting}
                className="flex-1 py-4 text-orange-600 font-semibold active:bg-orange-50 transition-colors disabled:opacity-50"
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
