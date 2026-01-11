'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { X, AlertTriangle, Trash2, Edit3 } from 'lucide-react'
import { DeleteSuccessAnimation } from '@/components/shared/DeleteSuccessAnimation'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  role: 'versicherung' | 'werkstatt' | 'admin'
  userId: string
  onSave?: () => void
  hideDeleteOption?: boolean
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

interface AdminData {
  display_name: string
  email: string
}

export function ProfileEditModal({ isOpen, onClose, role, userId, onSave, hideDeleteOption = false }: ProfileEditModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

  // Admin data
  const [adminData, setAdminData] = useState<AdminData>({
    display_name: '',
    email: '',
  })

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
    } else if (role === 'admin') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single()

      const { data: { user } } = await supabase.auth.getUser()

      setAdminData({
        display_name: profile?.display_name || 'Administrator',
        email: user?.email || '',
      })
    }

    setIsLoading(false)
  }

  async function handleSaveVersicherung(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

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

  async function handleSaveAdmin(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: adminData.display_name,
      })
      .eq('id', userId)

    setIsSaving(false)

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      toast.success('Profil erfolgreich aktualisiert')
      onSave?.()
      onClose()
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

  function getModalTitle() {
    if (role === 'admin') return 'Admin Profil'
    if (role === 'versicherung') return 'Profil bearbeiten'
    if (editingStandort) return 'Standort bearbeiten'
    return 'Standorte verwalten'
  }

  if (!isOpen && !showDeleteSuccess) return null

  // Delete success animation
  if (showDeleteSuccess) {
    return <DeleteSuccessAnimation show={showDeleteSuccess} />
  }

  // Delete confirmation modal
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-5 border-b border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900">Konto löschen</h2>
                <p className="text-sm text-red-700">Diese Aktion kann nicht rückgängig gemacht werden</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="mb-5">
              <p className="text-slate-700 text-sm mb-3">
                Wenn Sie Ihr Konto löschen, werden <strong>alle Ihre Daten unwiderruflich entfernt</strong>, einschließlich:
              </p>
              <ul className="text-sm text-slate-600 space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  Profil- und Kontoinformationen
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  {role === 'versicherung' ? 'Versicherungsdaten' : 'Werkstatt- und Standortdaten'}
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  Zugang zu allen verknüpften Schadensfällen
                </li>
              </ul>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Geben Sie <span className="font-bold text-red-600">LÖSCHEN</span> ein, um zu bestätigen:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="LÖSCHEN"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-base"
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
                className="flex-1 py-3.5 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium active:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'LÖSCHEN'}
                className="flex-1 py-3.5 px-4 bg-red-600 rounded-xl text-white font-medium active:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Wird gelöscht...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Löschen
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold">
            {getModalTitle()}
          </h2>
          <button
            onClick={() => {
              setEditingStandort(null)
              onClose()
            }}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            </div>
          ) : role === 'admin' ? (
            // Admin Profile Form
            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Anzeigename</label>
                <input
                  type="text"
                  value={adminData.display_name}
                  onChange={(e) => setAdminData({ ...adminData, display_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-Mail</label>
                <input
                  type="email"
                  value={adminData.email}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-base"
                  disabled
                />
                <p className="text-xs text-slate-500 mt-1">E-Mail kann nicht geändert werden</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium active:bg-slate-100 transition-colors">
                  Abbrechen
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3.5 px-4 bg-red-600 rounded-xl text-white font-medium active:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Speichern...
                    </>
                  ) : 'Speichern'}
                </button>
              </div>
            </form>
          ) : role === 'versicherung' ? (
            <form onSubmit={handleSaveVersicherung} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Firmenname</label>
                <input
                  type="text"
                  value={versicherungData.firma}
                  onChange={(e) => setVersicherungData({ ...versicherungData, firma: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse</label>
                <input
                  type="text"
                  value={versicherungData.adresse}
                  onChange={(e) => setVersicherungData({ ...versicherungData, adresse: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ansprechpartner</label>
                <input
                  type="text"
                  value={versicherungData.ansprechpartner}
                  onChange={(e) => setVersicherungData({ ...versicherungData, ansprechpartner: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={versicherungData.telefon}
                  onChange={(e) => setVersicherungData({ ...versicherungData, telefon: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-base"
                  required
                />
              </div>
              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-semibold mb-4">Bankverbindung</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bankname</label>
                    <input
                      type="text"
                      value={versicherungData.bankname}
                      onChange={(e) => setVersicherungData({ ...versicherungData, bankname: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">IBAN</label>
                    <input
                      type="text"
                      value={versicherungData.iban}
                      onChange={(e) => setVersicherungData({ ...versicherungData, iban: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-base"
                      placeholder="DE89 3704 0044 0532 0130 00"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium active:bg-slate-100 transition-colors">
                  Abbrechen
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3.5 px-4 bg-purple-600 rounded-xl text-white font-medium active:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Speichern...
                    </>
                  ) : 'Speichern'}
                </button>
              </div>

              {/* Delete Account Section */}
              {!hideDeleteOption && (
                <div className="pt-6 mt-6 border-t border-red-200">
                  <div className="p-4 bg-red-50 rounded-xl">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Gefahrenzone
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      Das Löschen Ihres Kontos ist endgültig und kann nicht rückgängig gemacht werden.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-3 px-4 border border-red-300 rounded-xl text-red-700 font-medium active:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Konto löschen
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : editingStandort ? (
            <form onSubmit={handleSaveStandort} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Standortname</label>
                <input
                  type="text"
                  value={editingStandort.name}
                  onChange={(e) => setEditingStandort({ ...editingStandort, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse</label>
                <input
                  type="text"
                  value={editingStandort.adresse}
                  onChange={(e) => setEditingStandort({ ...editingStandort, adresse: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ansprechpartner</label>
                <input
                  type="text"
                  value={editingStandort.ansprechpartner}
                  onChange={(e) => setEditingStandort({ ...editingStandort, ansprechpartner: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={editingStandort.telefon}
                  onChange={(e) => setEditingStandort({ ...editingStandort, telefon: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-base"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingStandort(null)} className="flex-1 py-3.5 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium active:bg-slate-100 transition-colors">
                  Abbrechen
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3.5 px-4 bg-orange-600 rounded-xl text-white font-medium active:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Speichern...
                    </>
                  ) : 'Speichern'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {standorte.map((standort) => (
                <div
                  key={standort.id}
                  className="p-4 rounded-xl border border-slate-200 active:border-orange-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{standort.name}</h4>
                        {standort.is_primary && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Haupt</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">{standort.adresse}</p>
                      <p className="text-sm text-slate-500">{standort.ansprechpartner} - {standort.telefon}</p>
                    </div>
                    <button
                      onClick={() => setEditingStandort(standort)}
                      className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors flex-shrink-0 ml-3"
                    >
                      <Edit3 className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              ))}
              {standorte.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Keine Standorte vorhanden
                </div>
              )}
              <div className="pt-4">
                <button onClick={onClose} className="w-full py-3.5 px-4 border border-slate-300 rounded-xl text-slate-700 font-medium active:bg-slate-100 transition-colors">
                  Schliessen
                </button>
              </div>

              {/* Delete Account Section for Werkstatt */}
              {!hideDeleteOption && (
                <div className="pt-6 mt-2 border-t border-red-200">
                  <div className="p-4 bg-red-50 rounded-xl">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Gefahrenzone
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      Das Löschen Ihres Kontos ist endgültig und kann nicht rückgängig gemacht werden.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-3 px-4 border border-red-300 rounded-xl text-red-700 font-medium active:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Konto löschen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileEditModal
