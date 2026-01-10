'use client'

import Link from 'next/link'
import { LogIn, ArrowRight, LayoutDashboard } from 'lucide-react'

interface PublicHeaderProps {
  userRole?: string | null
}

export function PublicHeader({ userRole }: PublicHeaderProps) {
  // Determine dashboard URL based on role
  const getDashboardUrl = () => {
    switch (userRole) {
      case 'admin':
        return '/admin'
      case 'versicherung':
        return '/versicherung'
      case 'werkstatt':
        return '/werkstatt'
      default:
        return '/role-selection'
    }
  }

  // Get role display name and color
  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return { name: 'Admin', color: 'bg-red-500' }
      case 'versicherung':
        return { name: 'Versicherung', color: 'bg-purple-500' }
      case 'werkstatt':
        return { name: 'Werkstatt', color: 'bg-orange-500' }
      default:
        return null
    }
  }

  const roleInfo = getRoleInfo()

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href={userRole ? '/?home=true' : '/'} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary-500))] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-900">Glasschaden<span className="text-[hsl(var(--primary-500))]">Melden</span></span>
        </Link>

        {/* Mobile: Show Dashboard or Login */}
        {userRole && roleInfo ? (
          <Link
            href={getDashboardUrl()}
            className="px-3 py-2 rounded-xl bg-[hsl(var(--primary-500))] text-white text-sm font-medium flex items-center gap-1.5 active:bg-[hsl(var(--primary-600))] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        ) : (
          <Link
            href="/role-selection"
            className="px-3 py-2 rounded-xl bg-[hsl(var(--primary-500))] text-white text-sm font-medium flex items-center gap-1.5 active:bg-[hsl(var(--primary-600))] transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Anmelden</span>
          </Link>
        )}
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block navbar">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={userRole ? '/?home=true' : '/'} className="logo-link">
            <div className="logo-icon">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="logo-text">Glasschaden<span className="logo-text-accent">Melden</span></span>
          </Link>

          {/* Centered Navigation */}
          <nav className="flex items-center gap-1">
            <Link href={userRole ? '/?home=true' : '/'} className="nav-link-modern">
              <span className="nav-link-text">Home</span>
              <span className="nav-link-indicator" />
            </Link>
            <Link href="/info" className="nav-link-modern">
              <span className="nav-link-text">Über Uns</span>
              <span className="nav-link-indicator" />
            </Link>
          </nav>

          {/* Show Dashboard button if logged in, otherwise show login button */}
          {userRole && roleInfo ? (
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${roleInfo.color}`}>
                {roleInfo.name}
              </span>
              <Link href={getDashboardUrl()} className="btn-primary">
                Zum Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <Link href="/role-selection" className="btn-primary">
              Anmelden / Registrieren
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </header>
    </>
  )
}

export default PublicHeader
