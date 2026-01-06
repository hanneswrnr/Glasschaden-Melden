'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, User, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  href: string
  icon: React.ReactNode
  label: string
}

interface BottomTabBarProps {
  basePath: string // '/versicherung' oder '/werkstatt'
}

/**
 * Mobile Bottom Tab Navigation
 * Native-ähnliche Tab Bar mit iOS-Style
 */
export function BottomTabBar({ basePath }: BottomTabBarProps) {
  const pathname = usePathname()

  const tabs: TabItem[] = [
    {
      href: basePath,
      icon: <Home className="w-6 h-6" />,
      label: 'Home',
    },
    {
      href: `${basePath}/claims`,
      icon: <FileText className="w-6 h-6" />,
      label: 'Claims',
    },
    {
      href: `${basePath}/messages`,
      icon: <MessageSquare className="w-6 h-6" />,
      label: 'Chat',
    },
    {
      href: `${basePath}/profile`,
      icon: <User className="w-6 h-6" />,
      label: 'Profil',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 tab-bar border-t border-slate-200 pb-safe z-50">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href ||
            (tab.href !== basePath && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full touch-target active-scale',
                isActive ? 'text-primary' : 'text-slate-400'
              )}
            >
              {tab.icon}
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomTabBar
