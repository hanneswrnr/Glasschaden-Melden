'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
  duration: number
}

interface WelcomeAnimationProps {
  show: boolean
  role: 'werkstatt' | 'versicherung'
  userName?: string
  onComplete?: () => void
  redirectTo?: string
}

const ROLE_CONFIG = {
  werkstatt: {
    title: 'Willkommen!',
    subtitle: 'Ihr Werkstatt-Account wurde erstellt',
    gradient: 'from-orange-500 via-amber-500 to-yellow-400',
    bgGradient: 'from-orange-50 to-amber-50',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
    textColor: 'text-orange-600',
    ringColor: 'ring-orange-500/30',
    particleColors: ['#f97316', '#fb923c', '#fbbf24', '#f59e0b', '#ea580c'],
    icon: (
      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  versicherung: {
    title: 'Willkommen!',
    subtitle: 'Ihr Versicherungs-Account wurde erstellt',
    gradient: 'from-indigo-500 via-purple-500 to-violet-400',
    bgGradient: 'from-indigo-50 to-purple-50',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    textColor: 'text-indigo-600',
    ringColor: 'ring-indigo-500/30',
    particleColors: ['#6366f1', '#8b5cf6', '#a78bfa', '#7c3aed', '#4f46e5'],
    icon: (
      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
}

export function WelcomeAnimation({
  show,
  role,
  userName,
  onComplete,
  redirectTo,
}: WelcomeAnimationProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering')
  const [particles, setParticles] = useState<Particle[]>([])
  const [showContent, setShowContent] = useState(false)
  const [showButton, setShowButton] = useState(false)

  const config = ROLE_CONFIG[role]

  // Generate particles
  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 3,
        color: config.particleColors[Math.floor(Math.random() * config.particleColors.length)],
        delay: Math.random() * 2,
        duration: Math.random() * 3 + 2,
      })
    }
    setParticles(newParticles)
  }, [config.particleColors])

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setPhase('entering')
      generateParticles()

      // Staggered content reveal
      setTimeout(() => setShowContent(true), 400)
      setTimeout(() => setShowButton(true), 1000)

      setTimeout(() => {
        setPhase('visible')
      }, 100)
    }
  }, [show, generateParticles])

  const handleContinue = () => {
    // Redirect immediately without showing the form behind
    if (redirectTo) {
      router.push(redirectTo)
    }
    onComplete?.()
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-500 ${
        phase === 'entering' ? 'opacity-0' : phase === 'exiting' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`}>
        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-float-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: 0.5,
            }}
          />
        ))}

        {/* Glowing Orbs */}
        <div
          className={`absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-gradient-to-br ${config.gradient} opacity-20 blur-3xl animate-pulse-slow`}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br ${config.gradient} opacity-15 blur-3xl animate-pulse-slow`}
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Content Card */}
      <div
        className={`relative z-10 w-full mx-4 transition-all duration-700 ${
          phase === 'entering' ? 'scale-90 translate-y-8' : phase === 'exiting' ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'
        }`}
      >
        <div className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ${config.ringColor} overflow-hidden`}>
          {/* Gradient Header Strip */}
          <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

          <div className="p-6 text-center">
            {/* Animated Icon */}
            <div
              className={`relative mx-auto mb-5 transition-all duration-700 ${
                showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              {/* Pulse rings */}
              <div className={`absolute inset-0 w-20 h-20 mx-auto ${config.iconBg} rounded-full animate-ping opacity-20`} />

              {/* Main icon container */}
              <div className={`relative w-20 h-20 mx-auto ${config.iconBg} rounded-full flex items-center justify-center shadow-xl`}>
                <div className="animate-bounce-gentle">
                  {config.icon}
                </div>
              </div>

              {/* Checkmark badge */}
              <div className="absolute -bottom-1 -right-1 left-1/2 ml-5">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-scale-in" style={{ animationDelay: '0.8s' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1
              className={`text-xl font-bold text-slate-800 mb-2 transition-all duration-700 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              {config.title}
            </h1>

            {/* Subtitle */}
            <p
              className={`text-base ${config.textColor} mb-1 transition-all duration-700 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              {config.subtitle}
            </p>

            {/* User greeting */}
            {userName && (
              <p
                className={`text-sm text-slate-600 mb-5 transition-all duration-700 ${
                  showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: '600ms' }}
              >
                Hallo, <span className="font-semibold">{userName}</span>!
              </p>
            )}

            {/* Features list */}
            <div
              className={`bg-slate-50 rounded-2xl p-3 mb-5 transition-all duration-700 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              <p className="text-xs text-slate-600 mb-2">Sie können jetzt:</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {role === 'werkstatt' ? (
                  <>
                    <span className="px-2 py-1 bg-white rounded-full text-xs text-slate-700 shadow-sm">Aufträge annehmen</span>
                    <span className="px-2 py-1 bg-white rounded-full text-xs text-slate-700 shadow-sm">Standorte verwalten</span>
                    <span className="px-2 py-1 bg-white rounded-full text-xs text-slate-700 shadow-sm">Provisionen</span>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-1 bg-white rounded-full text-xs text-slate-700 shadow-sm">Schäden melden</span>
                    <span className="px-2 py-1 bg-white rounded-full text-xs text-slate-700 shadow-sm">Aufträge verfolgen</span>
                    <span className="px-2 py-1 bg-white rounded-full text-xs text-slate-700 shadow-sm">Statistiken</span>
                  </>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleContinue}
              className={`w-full py-3.5 px-6 bg-gradient-to-r ${config.gradient} text-white font-semibold rounded-2xl shadow-lg active:scale-[0.98] transition-all duration-500 ${
                showButton ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                Zum Dashboard
                <svg className="w-5 h-5 animate-bounce-x" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(180deg);
          }
        }
        .animate-float-particle {
          animation: float-particle 3s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        @keyframes scale-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
          animation-fill-mode: both;
        }
        @keyframes bounce-x {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(3px);
          }
        }
        .animate-bounce-x {
          animation: bounce-x 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
