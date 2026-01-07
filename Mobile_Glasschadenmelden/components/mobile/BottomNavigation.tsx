'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Info, LogIn, LayoutDashboard, Shield, Wrench } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

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

// Navigation für eingeloggte User (auf der Homepage)
const loggedInPublicNavItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/info', icon: Info, label: 'Info' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const [activeIndex, setActiveIndex] = useState(0)
  const [ripple, setRipple] = useState<{ index: number; x: number; y: number } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showNav, setShowNav] = useState(false)

  const supabase = getSupabaseClient()

  // Check auth state
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)

        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserRole(profile.role)
        }
      } else {
        setIsLoggedIn(false)
        setUserRole(null)
      }

      // Loading complete - trigger slide-in animation
      setIsLoading(false)
      setTimeout(() => setShowNav(true), 100)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true)
        // Refetch role
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUserRole(data.role)
          })
      } else {
        setIsLoggedIn(false)
        setUserRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Get dashboard path based on role
  const getDashboardPath = () => {
    switch (userRole) {
      case 'versicherung':
        return '/versicherung'
      case 'werkstatt':
        return '/werkstatt'
      case 'admin':
        return '/admin'
      default:
        return '/login'
    }
  }

  // Get role-specific icon
  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin':
        return Shield
      case 'versicherung':
        return Shield
      case 'werkstatt':
        return Wrench
      default:
        return LayoutDashboard
    }
  }

  // Get role-specific label
  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin'
      case 'versicherung':
        return 'Versicherung'
      case 'werkstatt':
        return 'Werkstatt'
      default:
        return 'Dashboard'
    }
  }

  // Determine which navigation to show
  const getNavItems = (): NavItem[] => {
    // If logged in, show Home, Info, and role-specific Dashboard
    if (isLoggedIn && userRole) {
      return [
        { href: '/?home=true', icon: Home, label: 'Home' },
        { href: '/info', icon: Info, label: 'Info' },
        { href: getDashboardPath(), icon: getRoleIcon(), label: getRoleLabel() },
      ]
    }

    return publicNavItems
  }

  // Get role-specific gradient for the active pill
  const getActiveGradient = () => {
    // Check if the active item is the dashboard (index 2 when logged in)
    if (isLoggedIn && userRole && activeIndex === 2) {
      switch (userRole) {
        case 'admin':
          return 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/40'
        case 'versicherung':
          return 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/40'
        case 'werkstatt':
          return 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/40'
      }
    }
    return 'bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-indigo-500/40'
  }

  const navItems = getNavItems()
  // Wider item for "Versicherung" label
  const itemWidth = isLoggedIn && userRole === 'versicherung' ? 85 : 72
  const gap = 4 // Gap between items

  // Find active index
  useEffect(() => {
    const index = navItems.findIndex(item => {
      // Exact match
      if (item.href === pathname) return true
      // Home with query param
      if (item.href === '/?home=true' && pathname === '/') return true
      // Dashboard routes
      if (item.label === 'Dashboard') {
        if (pathname.startsWith('/versicherung') ||
            pathname.startsWith('/werkstatt') ||
            pathname.startsWith('/admin')) {
          return true
        }
      }
      // Other prefix matches (but not for root)
      if (item.href !== '/' && item.href !== '/?home=true' && pathname.startsWith(item.href)) return true
      return false
    })
    setActiveIndex(index >= 0 ? index : 0)
  }, [pathname, navItems])

  // Ripple effect handler
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setRipple({ index, x, y })
    setTimeout(() => setRipple(null), 500)
  }

  // Hide navigation on login/register pages, during loading, or if no items
  if (pathname.includes('/login') ||
      pathname.includes('/register') ||
      pathname.includes('/role-selection') ||
      navItems.length === 0 ||
      isLoading) {
    return null
  }

  return (
    <div
      className={`fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500 ease-out ${
        showNav
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
      }`}
    >
      <nav className="relative bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-black/15 border border-slate-200/50 p-1.5">
        {/* Animated Background Pill */}
        <div
          className={`absolute top-1.5 bottom-1.5 rounded-[22px] transition-all duration-300 ease-out shadow-lg ${getActiveGradient()}`}
          style={{
            width: itemWidth,
            transform: `translateX(${activeIndex * (itemWidth + gap)}px)`,
          }}
        />

        <div className="relative flex items-center" style={{ gap: `${gap}px` }}>
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = index === activeIndex
            const isRoleItem = isLoggedIn && userRole && index === 2

            // Get inactive color for role item
            const getInactiveRoleColor = () => {
              if (!isRoleItem || isActive) return ''
              switch (userRole) {
                case 'admin':
                  return 'text-red-500'
                case 'versicherung':
                  return 'text-purple-500'
                case 'werkstatt':
                  return 'text-orange-500'
                default:
                  return ''
              }
            }

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
                    : isRoleItem
                      ? `${getInactiveRoleColor()} hover:bg-slate-100/50 active:scale-95`
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
                    ${isActive ? 'opacity-100' : isRoleItem ? 'opacity-80' : 'opacity-60'}
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
