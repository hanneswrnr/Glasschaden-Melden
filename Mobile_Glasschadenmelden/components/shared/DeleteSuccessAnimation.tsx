'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteSuccessAnimationProps {
  show: boolean
  redirectTo?: string
}

export function DeleteSuccessAnimation({ show, redirectTo = '/' }: DeleteSuccessAnimationProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering')
  const [showContent, setShowContent] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setPhase('entering')

      setTimeout(() => setShowContent(true), 200)
      setTimeout(() => setPhase('visible'), 100)

      // Countdown
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            setShouldRedirect(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(countdownInterval)
    }
  }, [show])

  // Separate effect for navigation to avoid setState during render
  useEffect(() => {
    if (shouldRedirect) {
      router.push(redirectTo)
    }
  }, [shouldRedirect, router, redirectTo])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-500 ${
        phase === 'entering' ? 'opacity-0' : phase === 'exiting' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200">
        {/* Subtle floating elements */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-slate-300/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-slate-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content Card */}
      <div
        className={`relative z-10 w-full transition-all duration-700 ${
          phase === 'entering' ? 'scale-90 translate-y-8' : 'scale-100 translate-y-0'
        }`}
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
          {/* Gradient Header Strip */}
          <div className="h-1.5 bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700" />

          <div className="p-6 text-center">
            {/* Animated Icon */}
            <div
              className={`relative mx-auto mb-5 transition-all duration-700 ${
                showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              {/* Main icon container */}
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-slate-500 to-slate-700 rounded-full flex items-center justify-center shadow-xl">
                <div className="animate-check-appear">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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
              Konto gelöscht
            </h1>

            {/* Subtitle */}
            <p
              className={`text-base text-slate-600 mb-5 transition-all duration-700 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              Ihr Konto wurde erfolgreich gelöscht.
            </p>

            {/* Info box */}
            <div
              className={`bg-slate-50 rounded-2xl p-3 mb-5 transition-all duration-700 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              <p className="text-xs text-slate-600">
                Alle Ihre Daten wurden unwiderruflich entfernt.
              </p>
            </div>

            {/* Countdown */}
            <div
              className={`text-slate-500 transition-all duration-700 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '800ms' }}
            >
              <p className="text-sm">
                Weiterleitung in <span className="font-bold text-slate-700">{countdown}</span> Sekunde{countdown !== 1 ? 'n' : ''}...
              </p>
            </div>

            {/* Manual redirect button */}
            <button
              onClick={() => router.push(redirectTo)}
              className={`mt-5 w-full py-3.5 px-6 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-2xl shadow-lg active:scale-[0.98] transition-all duration-500 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '1000ms' }}
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes check-appear {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        .animate-check-appear {
          animation: check-appear 0.6s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
