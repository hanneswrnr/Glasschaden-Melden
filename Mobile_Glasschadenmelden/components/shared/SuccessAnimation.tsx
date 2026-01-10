'use client'

import { useEffect, useState } from 'react'
import { Check, X, AlertTriangle } from 'lucide-react'

interface SuccessAnimationProps {
  show: boolean
  message: string
  type?: 'success' | 'error' | 'warning' | 'status'
  color?: string // Custom color for status changes (e.g., 'orange', 'blue', 'green')
  onComplete?: () => void
  duration?: number
}

// Status color mapping - must match badge colors in status dropdowns
const STATUS_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  // Status colors (matching badge colors: yellow, blue, purple, green)
  neu: { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-500/30' },
  in_bearbeitung: { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-500/30' },
  reparatur_abgeschlossen: { bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-500/30' },
  abgeschlossen: { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-500/30' },
  storniert: { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-500/30' },
  // Generic colors
  green: { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-500/30' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-500/30' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-500/30' },
  red: { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-500/30' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-500/30' },
  yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-500/30' },
}

export function SuccessAnimation({
  show,
  message,
  type = 'success',
  color,
  onComplete,
  duration = 1500
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setIsAnimating(true)

      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(() => {
          setIsVisible(false)
          onComplete?.()
        }, 300) // Fade out duration
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, onComplete])

  if (!isVisible) return null

  // Determine colors based on type and custom color
  const getColors = () => {
    if (color && STATUS_COLORS[color]) {
      return STATUS_COLORS[color]
    }
    switch (type) {
      case 'error':
        return STATUS_COLORS.red
      case 'warning':
        return STATUS_COLORS.orange
      case 'status':
        return color ? STATUS_COLORS[color] || STATUS_COLORS.green : STATUS_COLORS.green
      default:
        return STATUS_COLORS.green
    }
  }

  const colors = getColors()

  // Determine icon based on type
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <X className="w-7 h-7 text-white" />
      case 'warning':
        return <AlertTriangle className="w-7 h-7 text-white" />
      default:
        return <Check className="w-7 h-7 text-white" strokeWidth={3} />
    }
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[100] pointer-events-none transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-2xl ring-4 ${colors.ring} transition-transform duration-300 ${
          isAnimating ? 'scale-100' : 'scale-90'
        }`}
      >
        {/* Animated Circle with Icon */}
        <div className={`relative w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center`}>
          {/* Pulse ring animation */}
          <div className={`absolute inset-0 ${colors.bg} rounded-full animate-ping opacity-30`} />
          {/* Scale animation for the icon */}
          <div className={`transition-transform duration-500 ${isAnimating ? 'scale-100' : 'scale-0'}`}>
            {getIcon()}
          </div>
        </div>

        {/* Message */}
        <p className={`text-base font-semibold ${colors.text} text-center max-w-[200px]`}>
          {message}
        </p>
      </div>
    </div>
  )
}

// Hook for easier usage
export function useSuccessAnimation() {
  const [animationState, setAnimationState] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'warning' | 'status'
    color?: string
  }>({
    show: false,
    message: '',
    type: 'success',
    color: undefined
  })

  const showSuccess = (message: string, color?: string) => {
    setAnimationState({ show: true, message, type: 'success', color: color || 'green' })
  }

  const showError = (message: string) => {
    setAnimationState({ show: true, message, type: 'error', color: 'red' })
  }

  const showWarning = (message: string) => {
    setAnimationState({ show: true, message, type: 'warning', color: 'orange' })
  }

  const showStatus = (message: string, statusColor: string) => {
    setAnimationState({ show: true, message, type: 'status', color: statusColor })
  }

  const hideAnimation = () => {
    setAnimationState(prev => ({ ...prev, show: false }))
  }

  return {
    animationState,
    showSuccess,
    showError,
    showWarning,
    showStatus,
    hideAnimation,
    AnimationComponent: (
      <SuccessAnimation
        show={animationState.show}
        message={animationState.message}
        type={animationState.type}
        color={animationState.color}
        onComplete={hideAnimation}
      />
    )
  }
}
