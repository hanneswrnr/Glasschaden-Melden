'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DeleteSuccessAnimation } from '@/components/shared/DeleteSuccessAnimation'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  role: 'versicherung' | 'werkstatt'
  userId: string
  onSave?: () => void
}

interface VersicherungData {
  firma: string
  adresse: string
  ansprechpartner: string
  telefon: string
  bankname: string
  iban: string
}

interface StandortData {
  id: string
  name: string
  adresse: string
  ansprechpartner: string
  telefon: string
  is_primary: boolean
}

export function ProfileEditModal({ isOpen, onClose, role, userId, onSave }: ProfileEditModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

  // Versicherung data
  const [versicherungData, setVersicherungData] = useState<VersicherungData>({
    firma: '',
    adresse: '',
    ansprechpartner: '',
    telefon: '',
    bankname: '',
    iban: '',
  })

  // Werkstatt data (standorte)
  const [standorte, setStandorte] = useState<StandortData[]>([])
  const [editingStandort, setEditingStandort] = useState<StandortData | null>(null)

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (isOpen) {
      loadProfileData()
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }, [isOpen, userId, role])

  async function loadProfileData() {
    setIsLoading(true)

    if (role === 'versicherung') {
      const { data } = await supabase
        .from('versicherungen')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) {
        setVersicherungData({
          firma: data.firma || '',
          adresse: data.adresse || '',
          ansprechpartner: data.ansprechpartner || '',
          telefon: data.telefon || '',
          bankname: data.bankname || '',
          iban: data.iban || '',
        })
      }
    } else if (role === 'werkstatt') {
      const { data: werkstatt } = await supabase
        .from('werkstaetten')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (werkstatt) {
        const { data: standorteData } = await supabase
          .from('werkstatt_standorte')
          .select('*')
          .eq('werkstatt_id', werkstatt.id)
          .order('is_primary', { ascending: false })

        if (standorteData) {
          setStandorte(standorteData)
        }
      }
    }

    setIsLoading(false)
  }

  async function handleSaveVersicherung(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    // Update versicherungen table
    const { error: versicherungError } = await supabase
      .from('versicherungen')
      .update({
        firma: versicherungData.firma,
        adresse: versicherungData.adresse,
        ansprechpartner: versicherungData.ansprechpartner,
        telefon: versicherungData.telefon,
        bankname: versicherungData.bankname,
        iban: versicherungData.iban,
      })
      .eq('user_id', userId)

    // Also update profiles table for Supabase visibility
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        display_name: versicherungData.ansprechpartner,
        company_name: versicherungData.firma,
        phone: versicherungData.telefon,
        address: versicherungData.adresse,
      })
      .eq('id', userId)

    setIsSaving(false)

    if (versicherungError || profileError) {
      toast.error('Fehler beim Speichern: ' + (versicherungError?.message || profileError?.message))
    } else {
      toast.success('Profil erfolgreich aktualisiert')
      onSave?.()
      onClose()
    }
  }

  async function handleSaveStandort(e: React.FormEvent) {
    e.preventDefault()
    if (!editingStandort) return

    setIsSaving(true)

    const { error: standortError } = await supabase
      .from('werkstatt_standorte')
      .update({
        name: editingStandort.name,
        adresse: editingStandort.adresse,
        ansprechpartner: editingStandort.ansprechpartner,
        telefon: editingStandort.telefon,
      })
      .eq('id', editingStandort.id)

    // If editing primary standort, also update profiles table
    if (editingStandort.is_primary) {
      await supabase
        .from('profiles')
        .update({
          display_name: editingStandort.ansprechpartner,
          company_name: editingStandort.name,
          phone: editingStandort.telefon,
          address: editingStandort.adresse,
        })
        .eq('id', userId)
    }

    setIsSaving(false)

    if (standortError) {
      toast.error('Fehler beim Speichern: ' + standortError.message)
    } else {
      toast.success('Standort erfolgreich aktualisiert')
      setEditingStandort(null)
      loadProfileData()
      onSave?.()
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'LÖSCHEN') {
      toast.error('Bitte geben Sie "LÖSCHEN" ein, um fortzufahren')
      return
    }

    setIsDeleting(true)

    try {
      // Call the RPC function to completely delete the user
      const { error: deleteError } = await supabase.rpc('delete_user_completely', {
        user_id_to_delete: userId
      })

      if (deleteError) {
        throw deleteError
      }

      // Sign out the user
      await supabase.auth.signOut()

      // Show success animation
      setShowDeleteConfirm(false)
      setShowDeleteSuccess(true)
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Fehler beim Löschen des Kontos. Bitte kontaktieren Sie den Support.')
      setIsDeleting(false)
    }
  }

  if (!isOpen && !showDeleteSuccess) return null

  // Delete success animation
  if (showDeleteSuccess) {
    return <DeleteSuccessAnimation show={showDeleteSuccess} />
  }

  // Delete confirmation modal
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteConfirm(false)
              setDeleteConfirmText('')
            }
          }}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="p-6 border-b border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Konto löschen</h2>
                <p className="text-sm text-red-700">Diese Aktion kann nicht rückgängig gemacht werden</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-slate-700 mb-4">
                Wenn Sie Ihr Konto löschen, werden <strong>alle Ihre Daten unwiderruflich entfernt</strong>, einschließlich:
              </p>
              <ul className="text-sm text-slate-600 space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Profil- und Kontoinformationen
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {role === 'versicherung' ? 'Versicherungsdaten' : 'Werkstatt- und Standortdaten'}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Zugang zu allen verknüpften Schadensfällen
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Geben Sie <span className="font-bold text-red-600">LÖSCHEN</span> ein, um zu bestätigen:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="LÖSCHEN"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'LÖSCHEN'}
                className="flex-1 py-3 px-4 bg-red-600 rounded-xl text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Wird gelöscht...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Konto löschen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
          <h2 className="text-xl font-bold">
            {role === 'versicherung' ? 'Profil bearbeiten' : editingStandort ? 'Standort bearbeiten' : 'Standorte verwalten'}
          </h2>
          <button
            onClick={() => {
              setEditingStandort(null)
              onClose()
            }}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" />
            </div>
          ) : role === 'versicherung' ? (
            <form onSubmit={handleSaveVersicherung} className="space-y-4">
              <div>
                <label className="input-label">Firmenname</label>
                <input
                  type="text"
                  value={versicherungData.firma}
                  onChange={(e) => setVersicherungData({ ...versicherungData, firma: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="input-label">Adresse</label>
                <input
                  type="text"
                  value={versicherungData.adresse}
                  onChange={(e) => setVersicherungData({ ...versicherungData, adresse: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">Ansprechpartner</label>
                <input
                  type="text"
                  value={versicherungData.ansprechpartner}
                  onChange={(e) => setVersicherungData({ ...versicherungData, ansprechpartner: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="input-label">Telefon</label>
                <input
                  type="tel"
                  value={versicherungData.telefon}
                  onChange={(e) => setVersicherungData({ ...versicherungData, telefon: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="pt-4 border-t border-[hsl(var(--border))]">
                <h3 className="font-semibold mb-4">Bankverbindung</h3>
                <div className="space-y-4">
                  <div>
                    <label className="input-label">Bankname</label>
                    <input
                      type="text"
                      value={versicherungData.bankname}
                      onChange={(e) => setVersicherungData({ ...versicherungData, bankname: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="input-label">IBAN</label>
                    <input
                      type="text"
                      value={versicherungData.iban}
                      onChange={(e) => setVersicherungData({ ...versicherungData, iban: e.target.value })}
                      className="input"
                      placeholder="DE89 3704 0044 0532 0130 00"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  Abbrechen
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>

              {/* Delete Account Section */}
              <div className="pt-6 mt-6 border-t border-red-200">
                <div className="p-4 bg-red-50 rounded-xl">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Gefahrenzone
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    Das Löschen Ihres Kontos ist endgültig und kann nicht rückgängig gemacht werden.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 px-4 border border-red-300 rounded-xl text-red-700 font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Konto löschen
                  </button>
                </div>
              </div>
            </form>
          ) : editingStandort ? (
            <form onSubmit={handleSaveStandort} className="space-y-4">
              <div>
                <label className="input-label">Standortname</label>
                <input
                  type="text"
                  value={editingStandort.name}
                  onChange={(e) => setEditingStandort({ ...editingStandort, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="input-label">Adresse</label>
                <input
                  type="text"
                  value={editingStandort.adresse}
                  onChange={(e) => setEditingStandort({ ...editingStandort, adresse: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="input-label">Ansprechpartner</label>
                <input
                  type="text"
                  value={editingStandort.ansprechpartner}
                  onChange={(e) => setEditingStandort({ ...editingStandort, ansprechpartner: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="input-label">Telefon</label>
                <input
                  type="tel"
                  value={editingStandort.telefon}
                  onChange={(e) => setEditingStandort({ ...editingStandort, telefon: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingStandort(null)} className="btn-secondary flex-1">
                  Abbrechen
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                  {isSaving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {standorte.map((standort) => (
                <div
                  key={standort.id}
                  className="p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary-300))] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{standort.name}</h4>
                        {standort.is_primary && (
                          <span className="badge badge-primary text-xs">Hauptstandort</span>
                        )}
                      </div>
                      <p className="text-sm text-muted">{standort.adresse}</p>
                      <p className="text-sm text-muted">{standort.ansprechpartner} - {standort.telefon}</p>
                    </div>
                    <button
                      onClick={() => setEditingStandort(standort)}
                      className="btn-icon"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {standorte.length === 0 && (
                <div className="text-center py-8 text-muted">
                  Keine Standorte vorhanden
                </div>
              )}
              <div className="pt-4">
                <button onClick={onClose} className="btn-secondary w-full">
                  Schliessen
                </button>
              </div>

              {/* Delete Account Section for Werkstatt */}
              <div className="pt-6 mt-2 border-t border-red-200">
                <div className="p-4 bg-red-50 rounded-xl">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Gefahrenzone
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    Das Löschen Ihres Kontos ist endgültig und kann nicht rückgängig gemacht werden.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 px-4 border border-red-300 rounded-xl text-red-700 font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Konto löschen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileEditModal
