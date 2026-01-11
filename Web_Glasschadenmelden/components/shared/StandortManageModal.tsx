'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
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
      // Prüfe auf Duplikat über alle Werkstätten hinweg
      const { data: existingStandort, error: checkError } = await supabase
        .from('werkstatt_standorte')
        .select('id, name')
        .ilike('name', formData.name)
        .limit(1)
        .single()

      if (existingStandort && !checkError) {
        toast.error('Ein Standort mit diesem Namen existiert bereits. Bitte wählen Sie einen anderen Namen.')
        setIsSaving(false)
        return
      }

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Standorte verwalten</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Adresse"
                        value={formData.adresse}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Ansprechpartner"
                          value={formData.ansprechpartner}
                          onChange={(e) => setFormData({ ...formData, ansprechpartner: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                        <input
                          type="tel"
                          placeholder="Telefon"
                          value={formData.telefon}
                          onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                        >
                          {isSaving ? 'Speichern...' : 'Speichern'}
                        </button>
                        <button
                          onClick={resetForm}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{standort.name}</h4>
                          {standort.is_primary && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              Hauptstandort
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{standort.adresse}</p>
                        <p className="text-sm text-slate-500">{standort.ansprechpartner} • {standort.telefon}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!standort.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(standort.id)}
                            disabled={isSaving}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                            title="Als Hauptstandort setzen"
                          >
                            Haupt
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(standort)}
                          className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200"
                        >
                          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(standort.id)}
                          disabled={isSaving}
                          className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Ansprechpartner"
                      value={formData.ansprechpartner}
                      onChange={(e) => setFormData({ ...formData, ansprechpartner: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Telefon"
                      value={formData.telefon}
                      onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                    >
                      {isSaving ? 'Erstellen...' : 'Erstellen'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startAddNew}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Neuen Standort hinzufügen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>

      {/* Custom Delete Confirm Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Standort löschen?</h3>
              <p className="text-slate-600">
                Möchtest du <span className="font-semibold">"{deleteConfirm.standortName}"</span> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              {deleteConfirm.assignedCount > 0 && (
                <p className="text-orange-600 mt-2 text-sm">
                  Hinweis: {deleteConfirm.assignedCount} {deleteConfirm.assignedCount === 1 ? 'Auftrag ist' : 'Aufträge sind'} diesem Standort zugewiesen. {deleteConfirm.assignedCount === 1 ? 'Dieser wird' : 'Diese werden'} nicht gelöscht, aber die Standortzuweisung wird aufgehoben.
                </p>
              )}
            </div>
            <div className="flex border-t border-slate-200">
              <button
                onClick={() => setDeleteConfirm({ show: false, standortId: null, standortName: '', assignedCount: 0 })}
                className="flex-1 py-4 text-slate-700 font-medium border-r border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex-1 py-4 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
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
