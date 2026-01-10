'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { X, Plus, MapPin, Pencil, Trash2, Star } from 'lucide-react'
import { useSuccessAnimation } from '@/components/shared/SuccessAnimation'

interface Standort {
  id: string
  werkstatt_id: string
  name: string
  adresse: string
  ansprechpartner: string
  telefon: string
  is_primary: boolean
}

interface StandortManageModalProps {
  isOpen: boolean
  onClose: () => void
  werkstattId: string
  onUpdate: () => void
  editStandortId?: string | null
}

export function StandortManageModal({ isOpen, onClose, werkstattId, onUpdate, editStandortId }: StandortManageModalProps) {
  const supabase = getSupabaseClient()
  const { showSuccess, AnimationComponent } = useSuccessAnimation()
  const [standorte, setStandorte] = useState<Standort[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; standortId: string | null; standortName: string; assignedCount: number }>({
    show: false,
    standortId: null,
    standortName: '',
    assignedCount: 0
  })
  const [formData, setFormData] = useState({
    name: '',
    adresse: '',
    ansprechpartner: '',
    telefon: '',
  })

  useEffect(() => {
    if (isOpen && werkstattId) {
      loadStandorte()
    }
  }, [isOpen, werkstattId])

  // Prevent background scroll when modal is open
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

  // Auto-select standort for editing when editStandortId is provided
  useEffect(() => {
    if (editStandortId && standorte.length > 0) {
      const standortToEdit = standorte.find(s => s.id === editStandortId)
      if (standortToEdit) {
        startEdit(standortToEdit)
      }
    }
  }, [editStandortId, standorte])

  async function loadStandorte() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('werkstatt_standorte')
      .select('*')
      .eq('werkstatt_id', werkstattId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      toast.error('Fehler beim Laden der Standorte')
    } else {
      setStandorte(data || [])
    }
    setIsLoading(false)
  }

  function resetForm() {
    setFormData({ name: '', adresse: '', ansprechpartner: '', telefon: '' })
    setEditingId(null)
    setIsAddingNew(false)
  }

  function startEdit(standort: Standort) {
    setFormData({
      name: standort.name,
      adresse: standort.adresse,
      ansprechpartner: standort.ansprechpartner,
      telefon: standort.telefon,
    })
    setEditingId(standort.id)
    setIsAddingNew(false)
  }

  function startAddNew() {
    resetForm()
    setIsAddingNew(true)
  }

  async function handleSave() {
    if (!formData.name || !formData.adresse || !formData.ansprechpartner || !formData.telefon) {
      toast.error('Bitte alle Felder ausfüllen')
      return
    }

    setIsSaving(true)

    if (isAddingNew) {
      // Create new standort
      const isFirstStandort = standorte.length === 0
      const { error } = await supabase
        .from('werkstatt_standorte')
        .insert({
          werkstatt_id: werkstattId,
          name: formData.name,
          adresse: formData.adresse,
          ansprechpartner: formData.ansprechpartner,
          telefon: formData.telefon,
          is_primary: isFirstStandort, // First standort is automatically primary
        })

      if (error) {
        toast.error('Fehler beim Erstellen')
      } else {
        showSuccess('Standort erstellt')
        resetForm()
        loadStandorte()
        onUpdate()
      }
    } else if (editingId) {
      // Update existing standort
      const { error } = await supabase
        .from('werkstatt_standorte')
        .update({
          name: formData.name,
          adresse: formData.adresse,
          ansprechpartner: formData.ansprechpartner,
          telefon: formData.telefon,
        })
        .eq('id', editingId)

      if (error) {
        toast.error('Fehler beim Speichern')
      } else {
        showSuccess('Standort aktualisiert')
        resetForm()
        loadStandorte()
        onUpdate()
      }
    }

    setIsSaving(false)
  }

  async function handleSetPrimary(standortId: string) {
    setIsSaving(true)

    // First, unset all as primary
    await supabase
      .from('werkstatt_standorte')
      .update({ is_primary: false })
      .eq('werkstatt_id', werkstattId)

    // Then set the selected one as primary
    const { error } = await supabase
      .from('werkstatt_standorte')
      .update({ is_primary: true })
      .eq('id', standortId)

    if (error) {
      toast.error('Fehler beim Setzen als Hauptstandort')
    } else {
      showSuccess('Hauptstandort geändert')
      loadStandorte()
      onUpdate()
    }

    setIsSaving(false)
  }

  async function confirmDelete(standortId: string) {
    const standort = standorte.find(s => s.id === standortId)
    if (standort?.is_primary && standorte.length > 1) {
      toast.error('Hauptstandort kann nicht gelöscht werden. Setze zuerst einen anderen als Hauptstandort.')
      return
    }

    // Check if standort has assigned claims
    const { count, error } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('werkstatt_standort_id', standortId)

    if (error) {
      toast.error('Fehler beim Prüfen der Aufträge')
      return
    }

    setDeleteConfirm({ show: true, standortId, standortName: standort?.name || '', assignedCount: count || 0 })
  }

  async function handleDelete() {
    if (!deleteConfirm.standortId) return

    setIsSaving(true)

    // First, unassign all claims from this standort using RPC function
    if (deleteConfirm.assignedCount > 0) {
      const { error: unassignError } = await supabase
        .rpc('unassign_claims_from_standort', { standort_uuid: deleteConfirm.standortId })

      if (unassignError) {
        console.error('Unassign error:', unassignError)
        toast.error('Fehler beim Aufheben der Standortzuweisung')
        setIsSaving(false)
        return
      }
    }

    // Then delete the standort
    const { error } = await supabase
      .from('werkstatt_standorte')
      .delete()
      .eq('id', deleteConfirm.standortId)

    if (error) {
      toast.error('Fehler beim Löschen')
    } else {
      showSuccess('Standort gelöscht')
      loadStandorte()
      onUpdate()
    }
    setIsSaving(false)
    setDeleteConfirm({ show: false, standortId: null, standortName: '', assignedCount: 0 })
  }

  if (!isOpen) return null

  return (
    <>
    {AnimationComponent}
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Standorte verwalten</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Standorte List */}
              {standorte.map((standort) => (
                <div
                  key={standort.id}
                  className={`p-4 rounded-xl border ${
                    standort.is_primary ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  {editingId === standort.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Adresse"
                        value={formData.adresse}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Ansprechpartner"
                        value={formData.ansprechpartner}
                        onChange={(e) => setFormData({ ...formData, ansprechpartner: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                      <input
                        type="tel"
                        placeholder="Telefon"
                        value={formData.telefon}
                        onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium active:bg-orange-600 disabled:opacity-50"
                        >
                          {isSaving ? 'Speichern...' : 'Speichern'}
                        </button>
                        <button
                          onClick={resetForm}
                          className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium active:bg-slate-200"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <h4 className="font-semibold text-slate-900">{standort.name}</h4>
                          {standort.is_primary && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              Haupt
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{standort.adresse}</p>
                      <p className="text-sm text-slate-500">{standort.ansprechpartner} • {standort.telefon}</p>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        {!standort.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(standort.id)}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium active:bg-green-200 disabled:opacity-50"
                          >
                            <Star className="w-3.5 h-3.5" />
                            Als Haupt
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(standort)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium active:bg-slate-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => confirmDelete(standort.id)}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium active:bg-red-200 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Löschen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Form */}
              {isAddingNew ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 space-y-3">
                  <h4 className="font-semibold text-slate-900">Neuer Standort</h4>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Ansprechpartner"
                    value={formData.ansprechpartner}
                    onChange={(e) => setFormData({ ...formData, ansprechpartner: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium active:bg-orange-600 disabled:opacity-50"
                    >
                      {isSaving ? 'Erstellen...' : 'Erstellen'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium active:bg-slate-200"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startAddNew}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 active:border-orange-300 active:text-orange-600 active:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Neuen Standort hinzufügen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pt-4 pb-24 border-t border-slate-200 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium active:bg-slate-200 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>

      {/* Custom Delete Confirm Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Standort löschen?</h3>
              <p className="text-sm text-slate-600">
                Möchtest du <span className="font-semibold">"{deleteConfirm.standortName}"</span> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              {deleteConfirm.assignedCount > 0 && (
                <p className="text-orange-600 mt-2 text-xs">
                  Hinweis: {deleteConfirm.assignedCount} {deleteConfirm.assignedCount === 1 ? 'Auftrag ist' : 'Aufträge sind'} diesem Standort zugewiesen. {deleteConfirm.assignedCount === 1 ? 'Dieser wird' : 'Diese werden'} nicht gelöscht, aber die Standortzuweisung wird aufgehoben.
                </p>
              )}
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setDeleteConfirm({ show: false, standortId: null, standortName: '', assignedCount: 0 })}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200 active:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 py-4 text-red-600 font-semibold active:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Löschen...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
