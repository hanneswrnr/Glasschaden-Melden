'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'

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
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

    const { error } = await supabase
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

    setIsSaving(false)

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
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

    const { error } = await supabase
      .from('werkstatt_standorte')
      .update({
        name: editingStandort.name,
        adresse: editingStandort.adresse,
        ansprechpartner: editingStandort.ansprechpartner,
        telefon: editingStandort.telefon,
      })
      .eq('id', editingStandort.id)

    setIsSaving(false)

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      toast.success('Standort erfolgreich aktualisiert')
      setEditingStandort(null)
      loadProfileData()
      onSave?.()
    }
  }

  if (!isOpen) return null

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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileEditModal
