/**
 * Liste der deutschen Versicherungen
 * Für das Dropdown im Schadensmelde-Formular
 */

export interface Versicherung {
  id: string
  name: string
}

export const DEUTSCHE_VERSICHERUNGEN: Versicherung[] = [
  // Top 20 größte deutsche Versicherungen
  { id: 'allianz', name: 'Allianz' },
  { id: 'huk-coburg', name: 'HUK-COBURG' },
  { id: 'axa', name: 'AXA' },
  { id: 'ergo', name: 'ERGO' },
  { id: 'generali', name: 'Generali' },
  { id: 'zurich', name: 'Zurich' },
  { id: 'devk', name: 'DEVK' },
  { id: 'lvm', name: 'LVM' },
  { id: 'vhv', name: 'VHV' },
  { id: 'r-und-v', name: 'R+V Versicherung' },
  { id: 'continentale', name: 'Continentale' },
  { id: 'gothaer', name: 'Gothaer' },
  { id: 'nuernberger', name: 'Nürnberger' },
  { id: 'wgv', name: 'WGV' },
  { id: 'provinzial', name: 'Provinzial' },
  { id: 'sparkassen-versicherung', name: 'Sparkassen-Versicherung' },
  { id: 'debeka', name: 'Debeka' },
  { id: 'signal-iduna', name: 'SIGNAL IDUNA' },
  { id: 'volkswohl-bund', name: 'Volkswohl Bund' },
  { id: 'concordia', name: 'Concordia' },

  // Weitere bekannte Versicherungen
  { id: 'hdi', name: 'HDI' },
  { id: 'arag', name: 'ARAG' },
  { id: 'cosmos-direkt', name: 'CosmosDirekt' },
  { id: 'da-direkt', name: 'DA Direkt' },
  { id: 'verti', name: 'Verti' },
  { id: 'check24', name: 'CHECK24 Versicherung' },
  { id: 'friday', name: 'FRIDAY' },
  { id: 'wefox', name: 'wefox' },
  { id: 'nexible', name: 'nexible' },
  { id: 'hannoversche', name: 'Hannoversche' },
  { id: 'inter', name: 'INTER' },
  { id: 'alte-leipziger', name: 'Alte Leipziger' },
  { id: 'basler', name: 'Basler' },
  { id: 'itzehoer', name: 'Itzehoer' },
  { id: 'vgh', name: 'VGH' },
  { id: 'wuerttembergische', name: 'Württembergische' },
  { id: 'barmenia', name: 'Barmenia' },
  { id: 'helvetia', name: 'Helvetia' },
  { id: 'kravag', name: 'KRAVAG' },
  { id: 'roland', name: 'ROLAND' },

  // Sonstige Option am Ende
  { id: 'sonstige', name: 'Sonstige' },
]

// Hilfsfunktion um Versicherung nach ID zu finden
export function getVersicherungById(id: string): Versicherung | undefined {
  return DEUTSCHE_VERSICHERUNGEN.find(v => v.id === id)
}

// Hilfsfunktion um Versicherung nach Name zu finden
export function getVersicherungByName(name: string): Versicherung | undefined {
  return DEUTSCHE_VERSICHERUNGEN.find(v => v.name.toLowerCase() === name.toLowerCase())
}
