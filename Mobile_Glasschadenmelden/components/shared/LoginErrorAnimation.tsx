'use client'

import { useEffect, useState } from 'react'

interface LoginErrorAnimationProps {
  show: boolean
  onClose: () => void
  errorType?: 'invalid_credentials' | 'email_not_confirmed' | 'user_not_found' | 'generic'
}

const ERROR_CONFIG = {
  invalid_credentials: {
    title: 'Anmeldung fehlgeschlagen',
    message: 'Die eingegebenen Anmeldedaten sind ungültig.',
    hint: 'Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.',
  },
  email_not_confirmed: {
    title: 'E-Mail nicht bestätigt',
    message: 'Ihre E-Mail-Adresse wurde noch nicht bestätigt.',
    hint: 'Bitte prüfen Sie Ihr Postfach.',
  },
  user_not_found: {
    title: 'Benutzer nicht gefunden',
    message: 'Es existiert kein Konto mit dieser E-Mail.',
    hint: 'Möchten Sie ein neues Konto erstellen?',
  },
  generic: {
    title: 'Anmeldung fehlgeschlagen',
    message: 'Ein unerwarteter Fehler ist aufgetreten.',
    hint: 'Bitte versuchen Sie es später erneut.',
  },
}

export function LoginErrorAnimation({ show, onClose, errorType = 'invalid_credentials' }: LoginErrorAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering')
  const [showContent, setShowContent] = useState(false)

  const config = ERROR_CONFIG[errorType]

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
        className={`relative z-10 w-full transition-all duration-300 ${
          phase === 'entering' ? 'scale-90 translate-y-4' : phase === 'exiting' ? 'scale-95 translate-y-2' : 'scale-100 translate-y-0'
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Red gradient header */}
          <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />

          <div className="p-6 text-center">
            {/* Animated Icon */}
            <div
              className={`relative mx-auto mb-5 transition-all duration-500 ${
                showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              {/* Shake animation container */}
              <div className="animate-shake">
                {/* Pulse ring */}
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-red-500 rounded-full animate-ping opacity-20" />

                {/* Main icon */}
                <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>

                  {/* X badge */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2
              className={`text-lg font-bold text-slate-800 mb-1.5 transition-all duration-500 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '100ms' }}
            >
              {config.title}
            </h2>

            {/* Message */}
            <p
              className={`text-sm text-slate-600 mb-1 transition-all duration-500 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              {config.message}
            </p>

            {/* Hint */}
            <p
              className={`text-xs text-slate-500 mb-5 transition-all duration-500 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              {config.hint}
            </p>

            {/* Button */}
            <button
              onClick={handleClose}
              className={`w-full py-3.5 px-6 bg-gradient-to-r from-red-500 to-rose-600 active:from-red-600 active:to-rose-700 text-white font-semibold rounded-2xl shadow-lg transition-all duration-500 active:scale-[0.98] ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              Erneut versuchen
            </button>
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
            transform: translateX(-3px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(3px);
          }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  )
}
