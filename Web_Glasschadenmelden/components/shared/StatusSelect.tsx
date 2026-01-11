'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

interface StatusOption {
  value: string
  label: string
  color: string
}

interface StatusSelectProps {
  options: StatusOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const DROPDOWN_WIDTH = 260

export function StatusSelect({
  options,
  value,
  onChange,
  disabled = false,
  className = '',
}: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: DROPDOWN_WIDTH })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isClickInsideDropdown = dropdownRef.current?.contains(target)
      const isClickInsideButton = buttonRef.current?.contains(target)

      if (!isClickInsideDropdown && !isClickInsideButton) {
        setIsOpen(false)
      }
    }

    // Use setTimeout to avoid immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - DROPDOWN_WIDTH,
        width: DROPDOWN_WIDTH,
      })
    }
  }, [isOpen])

  if (disabled) {
    return (
      <div className={`px-4 py-2 rounded-xl border font-medium text-sm ${selectedOption?.color || ''} ${className}`}>
        {selectedOption?.label}
      </div>
    )
  }

  const dropdownMenu = isOpen && typeof document !== 'undefined' ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
        animation: 'dropdown-open 0.2s ease-out',
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            onChange(option.value)
            setIsOpen(false)
          }}
          className={`
            w-full px-4 py-3 text-left transition-all duration-150
            flex items-center justify-between gap-3
            hover:bg-slate-50
            ${option.value === value ? 'bg-slate-50' : ''}
          `}
        >
          <span className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${option.color}`}>
            {option.label}
          </span>
          {option.value === value && (
            <Check className="w-4 h-4 text-green-500" />
          )}
        </button>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2
          rounded-xl border font-medium text-sm
          transition-all duration-200 cursor-pointer
          ${selectedOption?.color || ''}
          ${isOpen ? 'ring-2 ring-offset-1 ring-slate-300' : ''}
          hover:opacity-90
        `}
      >
        <span className="whitespace-nowrap">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {dropdownMenu}

      <style jsx>{`
        @keyframes dropdown-open {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
