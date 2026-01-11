'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface EmailErrorAnimationProps {
  show: boolean
  onClose: () => void
  email?: string
}

export function EmailErrorAnimation({ show, onClose, email }: EmailErrorAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering')
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setPhase('entering')
      setTimeout(() => setShowContent(true), 200)
      setTimeout(() => setPhase('visible'), 100)
    }
  }, [show])

  const handleClose = () => {
    setPhase('exiting')
    setTimeout(() => {
      setIsVisible(false)
      setShowContent(false)
      onClose()
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${
        phase === 'entering' ? 'opacity-0' : phase === 'exiting' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 max-w-md w-full transition-all duration-300 ${
          phase === 'entering' ? 'scale-90 translate-y-4' : phase === 'exiting' ? 'scale-95 translate-y-2' : 'scale-100 translate-y-0'
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Red gradient header */}
          <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />

          <div className="p-8 text-center">
            {/* Animated Icon */}
            <div
              className={`relative mx-auto mb-6 transition-all duration-500 ${
                showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              {/* Shake animation container */}
              <div className="animate-shake">
                {/* Pulse ring */}
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-red-500 rounded-full animate-ping opacity-20" />

                {/* Main icon */}
                <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>

                  {/* X badge */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2
              className={`text-xl font-bold text-slate-800 mb-3 transition-all duration-500 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '100ms' }}
            >
              E-Mail bereits registriert
            </h2>

            {/* Message */}
            <p
              className={`text-slate-600 mb-2 transition-all duration-500 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              Die E-Mail-Adresse
            </p>

            {email && (
              <p
                className={`text-red-600 font-semibold mb-2 transition-all duration-500 ${
                  showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: '300ms' }}
              >
                {email}
              </p>
            )}

            <p
              className={`text-slate-600 mb-6 transition-all duration-500 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              ist bereits vergeben. Bitte verwenden Sie eine andere E-Mail oder melden Sie sich an.
            </p>

            {/* Actions */}
            <div
              className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '500ms' }}
            >
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Andere E-Mail verwenden
              </button>
              <Link
                href="/login"
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium rounded-xl transition-all text-center"
              >
                Zur Anmeldung
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-4px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  )
}
