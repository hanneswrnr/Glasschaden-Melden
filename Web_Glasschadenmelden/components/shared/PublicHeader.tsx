'use client'

import Link from 'next/link'

export function PublicHeader() {
  return (
    <header className="navbar">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="logo-link">
          <div className="logo-icon">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="logo-text">Glasschaden<span className="logo-text-accent">Melden</span></span>
        </Link>

        {/* Centered Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="nav-link-modern">
            <span className="nav-link-text">Home</span>
            <span className="nav-link-indicator" />
          </Link>
          <Link href="/info" className="nav-link-modern">
            <span className="nav-link-text">Über Uns</span>
            <span className="nav-link-indicator" />
          </Link>
        </nav>

        <Link href="/role-selection" className="btn-primary">
          Anmelden / Registrieren
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </header>
  )
}

export default PublicHeader
