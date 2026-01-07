'use client'

import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
  minDuration?: number
}

export function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'exit'>('logo')

  useEffect(() => {
    // Phase 1: Logo erscheint
    const textTimer = setTimeout(() => {
      setPhase('text')
    }, 600)

    // Phase 2: Exit Animation
    const exitTimer = setTimeout(() => {
      setPhase('exit')
    }, minDuration - 400)

    // Phase 3: Complete
    const completeTimer = setTimeout(() => {
      onComplete()
    }, minDuration)

    return () => {
      clearTimeout(textTimer)
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [minDuration, onComplete])

  return (
    <div
      className={`
        fixed inset-0 z-[100] bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800
        flex flex-col items-center justify-center
        transition-all duration-500 ease-out
        ${phase === 'exit' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}
      `}
    >
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-white/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 bg-purple-500/10 rounded-full blur-3xl animate-float-slow-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          {/* Radial Pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-white/5 animate-ping-slow" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: '0.5s' }}>
            <div className="w-48 h-48 rounded-full bg-white/5 animate-ping-slower" />
          </div>
        </div>
      </div>

      {/* Logo Container */}
      <div
        className={`
          relative z-10 flex flex-col items-center
          transition-all duration-700 ease-out
          ${phase === 'logo' ? 'scale-100' : 'scale-100'}
        `}
      >
        {/* Logo Icon */}
        <div
          className={`
            w-28 h-28 rounded-3xl bg-white/95 backdrop-blur-xl
            flex items-center justify-center
            shadow-2xl shadow-black/20
            transition-all duration-700 ease-out
            ${phase === 'logo' ? 'animate-logo-entrance' : ''}
          `}
        >
          {/* Inner Glow */}
          <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-xl" />

          {/* Shield Icon */}
          <div className="relative">
            <Shield
              className={`
                w-14 h-14 text-indigo-600
                transition-all duration-500
                ${phase !== 'logo' ? 'animate-icon-pulse' : ''}
              `}
              strokeWidth={1.5}
            />
            {/* Checkmark inside shield */}
            <svg
              className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6
                transition-all duration-500 delay-300
                ${phase === 'logo' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
              `}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4" className="text-indigo-600 animate-draw-check" />
            </svg>
          </div>
        </div>

        {/* App Name */}
        <div
          className={`
            mt-8 text-center
            transition-all duration-700 ease-out
            ${phase === 'text' || phase === 'exit'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
            }
          `}
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Glasschaden
            <span className="text-indigo-300">Melden</span>
          </h1>
          <p className="mt-2 text-indigo-200/80 text-sm font-medium">
            Einfach. Schnell. Professionell.
          </p>
        </div>

        {/* Loading Indicator */}
        <div
          className={`
            mt-12 flex items-center gap-2
            transition-all duration-500
            ${phase === 'text' || phase === 'exit'
              ? 'opacity-100'
              : 'opacity-0'
            }
          `}
        >
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>

      {/* Bottom Branding */}
      <div
        className={`
          absolute bottom-8 text-center
          transition-all duration-500
          ${phase === 'text' || phase === 'exit'
            ? 'opacity-60'
            : 'opacity-0'
          }
        `}
      >
        <p className="text-xs text-white/50">
          Powered by Modern Technology
        </p>
      </div>
    </div>
  )
}

export default SplashScreen
