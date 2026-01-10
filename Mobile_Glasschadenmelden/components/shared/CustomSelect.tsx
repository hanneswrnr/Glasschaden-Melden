'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ReactNode
  required?: boolean
  className?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Auswählen...',
  icon,
  required = false,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lock body scroll when dropdown is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center gap-2 px-3 py-2.5
            bg-slate-50 border rounded-xl
            text-left transition-all duration-200
            ${isOpen
              ? 'border-purple-400 ring-2 ring-purple-100'
              : 'border-slate-200'
            }
            ${!selectedOption ? 'text-slate-400' : 'text-slate-900'}
          `}
        >
          {icon && (
            <span className={`flex-shrink-0 transition-colors ${isOpen ? 'text-purple-500' : 'text-slate-400'}`}>
              {icon}
            </span>
          )}
          <span className="flex-1 truncate text-sm">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-purple-500 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Hidden input for form validation */}
        {required && (
          <input
            type="text"
            required
            value={value}
            onChange={() => {}}
            className="sr-only"
            tabIndex={-1}
          />
        )}
      </div>

      {/* Full-screen Dropdown Overlay for Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet */}
          <div
            ref={listRef}
            onClick={(e) => e.stopPropagation()}
            className="
              absolute bottom-0 left-0 right-0
              bg-white rounded-t-3xl
              max-h-[70vh] overflow-hidden
              animate-slide-up
            "
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">{placeholder}</h3>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto max-h-[calc(70vh-100px)] pb-safe">
              {options.map((option) => (
                <div
                  key={option.value}
                  role="button"
                  tabIndex={0}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full px-4 py-3.5 flex items-center gap-3
                    text-left transition-colors cursor-pointer select-none
                    active:bg-purple-50
                    ${option.value === value ? 'bg-purple-50' : ''}
                  `}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span
                    className={`
                      flex-1 text-base pointer-events-none
                      ${option.value === value
                        ? 'text-purple-700 font-semibold'
                        : 'text-slate-900'
                      }
                    `}
                  >
                    {option.label}
                  </span>
                  {option.value === value && (
                    <Check className="w-5 h-5 text-purple-500 pointer-events-none" />
                  )}
                </div>
              ))}
            </div>

            {/* Cancel Button */}
            <div className="p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl active:bg-slate-200 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  )
}
