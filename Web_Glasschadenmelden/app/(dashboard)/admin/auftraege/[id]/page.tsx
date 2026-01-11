'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { CLAIM_STATUS_LABELS, DAMAGE_TYPE_LABELS, type ClaimStatus, type DamageType } from '@/lib/supabase/database.types'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'
import { ChatContainer } from '@/components/shared/Chat'
import { ArrowLeft, User, Phone, Shield, Car, AlertTriangle, Wrench, Edit3, Check, X, Trash2, Building2, MapPin, Clock, ChevronDown } from 'lucide-react'

interface Claim {
  id: string
  auftragsnummer: string | null
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
  completed_at: string | null
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
  { value: 'reparatur_abgeschlossen', label: 'Reparatur abgeschlossen', color: 'bg-purple-100 text-purple-700' },
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
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    checkAuth()
  }, [claimId])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Store user ID for chat
    setUserId(user.id)

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

    // Load versicherung info
    let versicherungData = null
    if (claimData.versicherung_id) {
      const { data: vers } = await supabase
        .from('versicherungen')
        .select('firma, ansprechpartner, email, telefon')
        .eq('id', claimData.versicherung_id)
        .single()
      versicherungData = vers
    }

    // Load standort info
    let standortData = null
    if (claimData.werkstatt_standort_id) {
      const { data: standort } = await supabase
        .from('werkstatt_standorte')
        .select('name, adresse')
        .eq('id', claimData.werkstatt_standort_id)
        .single()
      standortData = standort
    }

    const claimWithDetails = {
      ...claimData,
      versicherung: versicherungData,
      standort: standortData
    } as Claim

    setClaim(claimWithDetails)
    setEditData(claimWithDetails)
    setIsLoading(false)
  }

  async function handleStatusChange(newStatus: ClaimStatus) {
    if (!claim) return

    setIsSaving(true)
    // Set completed_at when status changes to 'abgeschlossen', reset to null otherwise
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      completed_at: newStatus === 'abgeschlossen' ? new Date().toISOString() : null
    }
    const { error } = await supabase
      .from('claims')
      .update(updateData)
      .eq('id', claim.id)

    if (error) {
      toast.error('Fehler beim Aktualisieren')
    } else {
      setClaim({
        ...claim,
        status: newStatus,
        completed_at: newStatus === 'abgeschlossen' ? new Date().toISOString() : null
      })
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
        <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!claim) return null

  const statusOption = STATUS_OPTIONS.find(s => s.value === claim.status)

  return (
    <>
    {AnimationComponent}
    <div className="min-h-screen bg-gradient-subtle pb-24 md:pb-8">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/auftraege"
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Auftrag Details</h1>
            <p className="text-xs text-red-600 font-mono font-medium">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center active:bg-orange-200 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-orange-600" />
          </button>
          {isEditing ? (
            <>
              <button
                onClick={() => { setIsEditing(false); setEditData(claim) }}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center active:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5 text-white" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center active:bg-red-700 transition-colors"
            >
              <Edit3 className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block navbar sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/auftraege" className="btn-icon">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">Auftrag Details</h1>
              <p className="text-sm text-red-600 font-mono font-medium">{claim.auftragsnummer || `#${claim.id.slice(0, 8)}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary text-orange-600 hover:bg-orange-50 border-orange-200"
            >
              <Trash2 className="w-4 h-4" />
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
                <Edit3 className="w-4 h-4" />
                Bearbeiten
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Content */}
      <main className="md:hidden px-4 py-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <ChevronDown className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Status</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOption?.color || ''}`}>
              {statusOption?.label}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={isSaving}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors active:scale-95 ${
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

        {/* Kundendaten Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Kundendaten</h3>
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Vorname</label>
                  <input
                    type="text"
                    value={editData.kunde_vorname || ''}
                    onChange={(e) => setEditData({ ...editData, kunde_vorname: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nachname</label>
                  <input
                    type="text"
                    value={editData.kunde_nachname || ''}
                    onChange={(e) => setEditData({ ...editData, kunde_nachname: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={editData.kunde_telefon || ''}
                  onChange={(e) => setEditData({ ...editData, kunde_telefon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Name</span>
                <span className="text-sm font-medium text-slate-900">{claim.kunde_vorname} {claim.kunde_nachname}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">Telefon</span>
                <a href={`tel:${claim.kunde_telefon}`} className="text-sm font-medium text-red-600">{claim.kunde_telefon}</a>
              </div>
            </div>
          )}
        </div>

        {/* Versicherungsdaten Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Versicherungsdaten</h3>
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Kundenversicherung</label>
                <input
                  type="text"
                  value={editData.vers_name || ''}
                  onChange={(e) => setEditData({ ...editData, vers_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Vers.-Nr.</label>
                  <input
                    type="text"
                    value={editData.vers_nr || ''}
                    onChange={(e) => setEditData({ ...editData, vers_nr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Selbstbeteiligung</label>
                  <input
                    type="number"
                    value={editData.selbstbeteiligung || ''}
                    onChange={(e) => setEditData({ ...editData, selbstbeteiligung: parseFloat(e.target.value) || null })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Versicherung</span>
                <span className="text-sm font-medium text-slate-900">{claim.vers_name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Vers.-Nr.</span>
                <span className="text-sm text-slate-900">{claim.vers_nr || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">Selbstbeteiligung</span>
                <span className="text-sm text-slate-900">{claim.selbstbeteiligung ? `${claim.selbstbeteiligung.toFixed(2)} EUR` : '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Fahrzeugdaten Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Car className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Fahrzeugdaten</h3>
          </div>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Kennzeichen</label>
                <input
                  type="text"
                  value={editData.kennzeichen || ''}
                  onChange={(e) => setEditData({ ...editData, kennzeichen: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">VIN</label>
                <input
                  type="text"
                  value={editData.vin || ''}
                  onChange={(e) => setEditData({ ...editData, vin: e.target.value.toUpperCase().replace(/[IOQ]/g, '') })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  maxLength={17}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Kennzeichen</span>
                <span className="text-sm font-medium text-slate-900">{claim.kennzeichen || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">VIN</span>
                <span className="text-xs font-mono text-slate-900">{claim.vin || '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Schadensdetails Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Schadensdetails</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Schadensart</span>
              <span className="text-sm font-medium text-slate-900">{DAMAGE_TYPE_LABELS[claim.schadensart] || claim.schadensart}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Datum</span>
              <span className="text-sm text-slate-900">{new Date(claim.schaden_datum).toLocaleDateString('de-DE')}</span>
            </div>
            {isEditing ? (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Beschreibung</label>
                <textarea
                  value={editData.beschreibung || ''}
                  onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[80px]"
                />
              </div>
            ) : (
              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-1">Beschreibung</p>
                <p className="text-sm text-slate-900">{claim.beschreibung || 'Keine Beschreibung'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vermittler Card */}
        {claim.versicherung && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Vermittler</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">{claim.versicherung.firma}</p>
              <p className="text-xs text-slate-500">{claim.versicherung.ansprechpartner}</p>
              <p className="text-xs text-slate-600">{claim.versicherung.email}</p>
              <p className="text-xs text-slate-600">{claim.versicherung.telefon}</p>
            </div>
          </div>
        )}

        {/* Werkstatt Card */}
        {claim.standort && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Werkstatt-Standort</h3>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{claim.standort.name}</p>
              <p className="text-xs text-slate-500">{claim.standort.adresse}</p>
            </div>
          </div>
        )}

        {/* Metadaten Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Metadaten</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Erstellt</span>
              <span className="text-slate-900">{new Date(claim.created_at).toLocaleString('de-DE')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Aktualisiert</span>
              <span className="text-slate-900">{new Date(claim.updated_at).toLocaleString('de-DE')}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">ID</span>
              <span className="font-mono text-slate-900">{claim.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Chat Section Mobile */}
        <div className="mt-4">
          <ChatContainer
            claimId={claim.id}
            currentUserId={userId}
            userRole="admin"
            completedAt={claim.completed_at}
            isReadOnly={false}
          />
        </div>
      </main>

      {/* Desktop Content */}
      <main className="hidden md:block max-w-5xl mx-auto px-6 py-8">
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
                  <Building2 className="w-5 h-5 text-purple-500" />
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
                  <MapPin className="w-5 h-5 text-green-500" />
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
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                Metadaten
              </h3>
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

        {/* Chat Section Desktop */}
        <div className="mt-6">
          <ChatContainer
            claimId={claim.id}
            currentUserId={userId}
            userRole="admin"
            completedAt={claim.completed_at}
            isReadOnly={false}
          />
        </div>
      </main>

      {/* Move to Trash Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] md:p-6">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md overflow-hidden shadow-xl">
            <div className="p-5 md:p-6 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Trash2 className="w-7 h-7 md:w-8 md:h-8 text-orange-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">In Papierkorb verschieben?</h3>
              <p className="text-sm md:text-base text-slate-600">
                Auftrag von <span className="font-semibold">{claim.kunde_vorname} {claim.kunde_nachname}</span> wird in den Papierkorb verschoben. Du kannst ihn dort wiederherstellen oder endgültig löschen.
              </p>
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3.5 md:py-4 text-slate-700 font-medium border-r border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleMoveToTrash}
                disabled={isDeleting}
                className="flex-1 py-3.5 md:py-4 text-orange-600 font-semibold hover:bg-orange-50 active:bg-orange-100 transition-colors disabled:opacity-50"
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
