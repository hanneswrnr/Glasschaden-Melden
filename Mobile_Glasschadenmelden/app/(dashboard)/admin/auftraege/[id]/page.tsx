'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { CLAIM_STATUS_LABELS, DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { ArrowLeft, Trash2, Edit3, Check, X, Phone, Building2, MapPin, Calendar, Car, FileText, Clock, User } from 'lucide-react'

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
  const [showStatusPicker, setShowStatusPicker] = useState(false)

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
    setShowStatusPicker(false)
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!claim) return null

  const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/auftraege"
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="font-semibold text-base">Auftrag Details</h1>
            <p className="text-xs text-slate-500">#{claim.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => { setIsEditing(false); setEditData(claim) }}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"
              >
                <Trash2 className="w-5 h-5 text-orange-600" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center"
              >
                <Edit3 className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 pb-8 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Status</h2>
            <button
              onClick={() => setShowStatusPicker(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusOption?.color || ''}`}
            >
              {statusOption?.label}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={isSaving}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  claim.status === option.value
                    ? 'ring-2 ring-red-500 ring-offset-1'
                    : ''
                } ${option.color}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Data */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Kundendaten</h2>
          </div>
          <div className="p-4 space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Vorname</label>
                    <input
                      type="text"
                      value={editData.kunde_vorname || ''}
                      onChange={(e) => setEditData({ ...editData, kunde_vorname: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Nachname</label>
                    <input
                      type="text"
                      value={editData.kunde_nachname || ''}
                      onChange={(e) => setEditData({ ...editData, kunde_nachname: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={editData.kunde_telefon || ''}
                    onChange={(e) => setEditData({ ...editData, kunde_telefon: e.target.value })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Name</span>
                  <span className="font-medium">{claim.kunde_vorname} {claim.kunde_nachname}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Telefon</span>
                  <a href={`tel:${claim.kunde_telefon}`} className="text-red-600 font-medium flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {claim.kunde_telefon}
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Insurance Data */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Versicherungsdaten</h2>
          </div>
          <div className="p-4 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Kundenversicherung</label>
                  <input
                    type="text"
                    value={editData.vers_name || ''}
                    onChange={(e) => setEditData({ ...editData, vers_name: e.target.value })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Vers.-Nr.</label>
                    <input
                      type="text"
                      value={editData.vers_nr || ''}
                      onChange={(e) => setEditData({ ...editData, vers_nr: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Selbstbeteiligung</label>
                    <input
                      type="number"
                      value={editData.selbstbeteiligung || ''}
                      onChange={(e) => setEditData({ ...editData, selbstbeteiligung: parseFloat(e.target.value) || null })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Versicherung</span>
                  <span className="font-medium">{claim.vers_name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Vers.-Nr.</span>
                  <span>{claim.vers_nr || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Selbstbeteiligung</span>
                  <span>{claim.selbstbeteiligung ? `${claim.selbstbeteiligung.toFixed(2)} EUR` : '-'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vehicle Data */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Car className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Fahrzeugdaten</h2>
          </div>
          <div className="p-4 space-y-4">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Kennzeichen</label>
                  <input
                    type="text"
                    value={editData.kennzeichen || ''}
                    onChange={(e) => setEditData({ ...editData, kennzeichen: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">VIN</label>
                  <input
                    type="text"
                    value={editData.vin || ''}
                    onChange={(e) => setEditData({ ...editData, vin: e.target.value.toUpperCase().replace(/[IOQ]/g, '') })}
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                    maxLength={17}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Kennzeichen</span>
                  <span className="font-medium">{claim.kennzeichen || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">VIN</span>
                  <span className="font-mono text-xs">{claim.vin || '-'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Damage Details */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Schadensdetails</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Schadensart</span>
              <span className="font-medium">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Schadensdatum</span>
              <span>{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</span>
            </div>
            {isEditing ? (
              <div>
                <label className="text-xs text-slate-500 block mb-1">Beschreibung</label>
                <textarea
                  value={editData.beschreibung || ''}
                  onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value })}
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none min-h-[100px]"
                />
              </div>
            ) : (
              <div>
                <p className="text-slate-500 text-sm mb-1">Beschreibung</p>
                <p className="text-sm">{claim.beschreibung || 'Keine Beschreibung'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vermittler Info */}
        {claim.versicherung && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-slate-900">Vermittler</h2>
            </div>
            <div className="p-4 space-y-2">
              <p className="font-semibold">{claim.versicherung.firma}</p>
              <p className="text-sm text-slate-500">{claim.versicherung.ansprechpartner}</p>
              <p className="text-sm">{claim.versicherung.email}</p>
              <p className="text-sm">{claim.versicherung.telefon}</p>
            </div>
          </div>
        )}

        {/* Werkstatt Info */}
        {claim.standort && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              <h2 className="font-semibold text-slate-900">Werkstatt-Standort</h2>
            </div>
            <div className="p-4 space-y-2">
              <p className="font-semibold">{claim.standort.name}</p>
              <p className="text-sm text-slate-500">{claim.standort.adresse}</p>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Metadaten</h2>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Erstellt</span>
              <span>{new Date(claim.created_at).toLocaleString('de-DE')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Aktualisiert</span>
              <span>{new Date(claim.updated_at).toLocaleString('de-DE')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ID</span>
              <span className="font-mono text-xs text-slate-400">{claim.id}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Move to Trash Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">In Papierkorb verschieben?</h3>
              <p className="text-sm text-slate-600">
                Auftrag <span className="font-mono font-semibold text-red-600">{claim.auftragsnummer}</span> von <span className="font-semibold">{claim.kunde_vorname} {claim.kunde_nachname}</span> wird in den Papierkorb verschoben. Du kannst ihn dort wiederherstellen oder endgültig löschen.
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
