'use client'

import { useState, useRef, useEffect } from 'react'

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
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

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

  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value)
          setIsOpen(false)
        }
        break
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center gap-3 px-4 py-3.5
          bg-[hsl(var(--card))] border-2 rounded-xl
          text-left transition-all duration-200
          ${isOpen
            ? 'border-[hsl(var(--primary-500))] ring-4 ring-[hsl(var(--primary-100))]'
            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary-300))]'
          }
          ${!selectedOption ? 'text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--foreground))]'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && (
          <span className={`flex-shrink-0 transition-colors ${isOpen ? 'text-[hsl(var(--primary-500))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
            {icon}
          </span>
        )}
        <span className="flex-1 truncate font-medium">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 text-[hsl(var(--primary-500))] ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
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

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="
            absolute z-50 w-full mt-2
            bg-[hsl(var(--card))] border-2 border-[hsl(var(--primary-200))]
            rounded-xl shadow-xl overflow-hidden
            max-h-[280px] overflow-y-auto
            animate-in fade-in-0 zoom-in-95 duration-200
          "
          style={{
            animation: 'dropdown-open 0.2s ease-out',
          }}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                px-4 py-3 cursor-pointer transition-all duration-150
                flex items-center gap-3
                ${highlightedIndex === index
                  ? 'bg-[hsl(var(--primary-50))]'
                  : ''
                }
                ${option.value === value
                  ? 'bg-[hsl(var(--primary-100))] text-[hsl(var(--primary-700))] font-semibold'
                  : 'text-[hsl(var(--foreground))]'
                }
                hover:bg-[hsl(var(--primary-50))]
              `}
            >
              <span className="flex-1">{option.label}</span>
              {option.value === value && (
                <svg className="w-5 h-5 text-[hsl(var(--primary-500))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}

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
