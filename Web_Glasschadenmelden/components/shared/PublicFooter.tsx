'use client'

import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary-500))] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold">GlasschadenMelden</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary-600))] transition-colors">Home</Link>
            <Link href="/info" className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary-600))] transition-colors">Über Uns</Link>
            <Link href="/role-selection" className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary-600))] transition-colors">Registrieren</Link>
          </div>
          <p className="text-sm text-[hsl(var(--foreground))]">
            © {new Date().getFullYear()} GlasschadenMelden. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
