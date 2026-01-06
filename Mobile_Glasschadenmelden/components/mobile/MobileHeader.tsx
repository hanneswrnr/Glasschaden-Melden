'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  rightAction?: React.ReactNode
  transparent?: boolean
}

/**
 * Mobile Header Component
 * iOS-style Navigation Header
 */
export function MobileHeader({
  title,
  showBack = false,
  rightAction,
  transparent = false,
}: MobileHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 pt-safe',
        transparent
          ? 'bg-transparent'
          : 'bg-white/80 backdrop-blur-lg border-b border-slate-200'
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back Button */}
        <div className="w-20">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="flex items-center text-primary active:opacity-70 touch-target -ml-2"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-base">Zurück</span>
            </button>
          )}
        </div>

        {/* Center: Title */}
        <h1 className="text-lg font-semibold text-slate-900 truncate">
          {title}
        </h1>

        {/* Right: Action */}
        <div className="w-20 flex justify-end">{rightAction}</div>
      </div>
    </header>
  )
}

export default MobileHeader
