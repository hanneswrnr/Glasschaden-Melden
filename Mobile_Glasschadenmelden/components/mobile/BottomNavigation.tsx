'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Info, LogIn, FileText, MessageSquare, User, Settings, PlusCircle, ArrowLeft } from 'lucide-react'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
}

// Navigation für nicht eingeloggte User
const publicNavItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/info', icon: Info, label: 'Info' },
  { href: '/login', icon: LogIn, label: 'Login' },
]

// Navigation für Versicherung
const versicherungNavItems: NavItem[] = [
  { href: '/versicherung', icon: Home, label: 'Home' },
  { href: '/versicherung/claims', icon: FileText, label: 'Schäden' },
  { href: '/versicherung/new', icon: PlusCircle, label: 'Neu' },
  { href: '/versicherung/messages', icon: MessageSquare, label: 'Chat' },
  { href: '/versicherung/profile', icon: User, label: 'Profil' },
]

// Navigation für Werkstatt
const werkstattNavItems: NavItem[] = [
  { href: '/werkstatt', icon: Home, label: 'Home' },
  { href: '/werkstatt/claims', icon: FileText, label: 'Aufträge' },
  { href: '/werkstatt/messages', icon: MessageSquare, label: 'Chat' },
  { href: '/werkstatt/profile', icon: User, label: 'Profil' },
]

// Navigation für Admin
const adminNavItems: NavItem[] = [
  { href: '/admin', icon: Home, label: 'Home' },
  { href: '/admin/users', icon: User, label: 'User' },
  { href: '/admin/audit', icon: FileText, label: 'Audit' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const [activeIndex, setActiveIndex] = useState(0)
  const [ripple, setRipple] = useState<{ index: number; x: number; y: number } | null>(null)

  // Bestimme welche Navigation angezeigt werden soll
  const getNavItems = (): NavItem[] => {
    if (pathname.startsWith('/versicherung')) return versicherungNavItems
    if (pathname.startsWith('/werkstatt')) return werkstattNavItems
    if (pathname.startsWith('/admin')) return adminNavItems
    return publicNavItems
  }

  const navItems = getNavItems()
  const itemWidth = 72 // Feste Breite pro Item
  const gap = 4 // Gap zwischen Items

  // Finde den aktiven Index
  useEffect(() => {
    const index = navItems.findIndex(item => {
      if (item.href === pathname) return true
      if (item.href !== '/' && pathname.startsWith(item.href)) return true
      return false
    })
    setActiveIndex(index >= 0 ? index : 0)
  }, [pathname, navItems])

  // Ripple-Effekt Handler
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setRipple({ index, x, y })
    setTimeout(() => setRipple(null), 500)
  }

  // Verstecke Navigation auf Login/Register Seiten
  if (pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/role-selection')) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="relative bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-black/15 border border-slate-200/50 p-1.5">
        {/* Animated Background Pill */}
        <div
          className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-[22px] transition-all duration-300 ease-out shadow-lg shadow-indigo-500/40"
          style={{
            width: itemWidth,
            transform: `translateX(${activeIndex * (itemWidth + gap)}px)`,
          }}
        />

        <div className="relative flex items-center" style={{ gap: `${gap}px` }}>
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = index === activeIndex

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleClick(e, index)}
                className={`
                  relative flex flex-col items-center justify-center
                  h-14 rounded-[20px]
                  transition-all duration-300 ease-out
                  overflow-hidden
                  ${isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 active:scale-95'
                  }
                `}
                style={{ width: itemWidth }}
              >
                {/* Ripple Effect */}
                {ripple?.index === index && (
                  <span
                    className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
                    style={{
                      left: ripple.x - 50,
                      top: ripple.y - 50,
                      width: 100,
                      height: 100,
                    }}
                  />
                )}

                {/* Icon with bounce animation */}
                <Icon
                  className={`
                    w-5 h-5 transition-all duration-300
                    ${isActive ? 'animate-icon-bounce' : ''}
                  `}
                />

                {/* Label */}
                <span
                  className={`
                    text-[10px] font-semibold mt-0.5 transition-all duration-300
                    ${isActive ? 'opacity-100' : 'opacity-60'}
                  `}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default BottomNavigation
