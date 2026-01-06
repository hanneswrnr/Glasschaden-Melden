'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search, FileText, Users, Settings, Home, X } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'claim' | 'page' | 'action'
  title: string
  subtitle?: string
  href?: string
  action?: () => void
}

/**
 * Command Palette (Strg + K)
 * Globale Suche für VIN, Kennzeichen, Namen, Navigation
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Keyboard Shortcut: Strg + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }

      // Hidden Admin Access: Strg + Umschalt + A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        router.push('/system-access/x-portal-x')
      }

      // Escape schließt Palette
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  // Suche durchführen
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults(getDefaultResults())
      return
    }

    setIsSearching(true)

    try {
      // TODO: Implementiere echte Suche via Supabase
      // const supabase = getSupabaseClient()
      // const { data } = await supabase
      //   .from('claims')
      //   .select('id, vin, kennzeichen, kunde_vorname, kunde_nachname')
      //   .or(`vin.ilike.%${query}%,kennzeichen.ilike.%${query}%,kunde_nachname.ilike.%${query}%`)
      //   .limit(5)

      // Placeholder Results
      setResults([
        {
          id: 'search-1',
          type: 'claim',
          title: `Suche: "${query}"`,
          subtitle: 'In Claims suchen...',
          href: `/versicherung/claims?search=${encodeURIComponent(query)}`,
        },
      ])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced Search
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(search)
    }, 300)

    return () => clearTimeout(timeout)
  }, [search, performSearch])

  // Standard-Navigation wenn keine Suche
  function getDefaultResults(): SearchResult[] {
    return [
      {
        id: 'nav-home',
        type: 'page',
        title: 'Dashboard',
        subtitle: 'Zur Übersicht',
        href: '/',
      },
      {
        id: 'nav-claims',
        type: 'page',
        title: 'Claims',
        subtitle: 'Alle Schadensmeldungen',
        href: '/versicherung/claims',
      },
      {
        id: 'nav-settings',
        type: 'page',
        title: 'Einstellungen',
        subtitle: 'Profil & Konto',
        href: '/settings',
      },
    ]
  }

  // Item auswählen
  function handleSelect(result: SearchResult) {
    if (result.action) {
      result.action()
    } else if (result.href) {
      router.push(result.href)
    }
    setOpen(false)
    setSearch('')
  }

  // Icon basierend auf Typ
  function getIcon(type: SearchResult['type']) {
    switch (type) {
      case 'claim':
        return <FileText className="w-4 h-4" />
      case 'page':
        return <Home className="w-4 h-4" />
      case 'action':
        return <Settings className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <Command className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b border-slate-200 px-4">
            <Search className="w-5 h-5 text-slate-400" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="VIN, Kennzeichen oder Name suchen..."
              className="flex-1 py-4 px-3 text-base outline-none placeholder:text-slate-400"
              autoFocus
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Results */}
          <Command.List className="max-h-80 overflow-auto p-2">
            {isSearching && (
              <Command.Loading className="p-4 text-center text-slate-500">
                Suche...
              </Command.Loading>
            )}

            <Command.Empty className="p-4 text-center text-slate-500">
              Keine Ergebnisse gefunden
            </Command.Empty>

            {results.map((result) => (
              <Command.Item
                key={result.id}
                value={result.title}
                onSelect={() => handleSelect(result)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100"
              >
                <span className="text-slate-400">{getIcon(result.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {result.title}
                  </p>
                  {result.subtitle && (
                    <p className="text-xs text-slate-500 truncate">
                      {result.subtitle}
                    </p>
                  )}
                </div>
              </Command.Item>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="border-t border-slate-200 px-4 py-2 flex items-center gap-4 text-xs text-slate-400">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↵</kbd> Auswählen
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↑↓</kbd> Navigieren
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Esc</kbd> Schließen
            </span>
          </div>
        </Command>
      </div>
    </div>
  )
}

export default CommandPalette
