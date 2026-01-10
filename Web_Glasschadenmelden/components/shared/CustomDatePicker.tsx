'use client'

import { useState, useRef, useEffect } from 'react'

interface CustomDatePickerProps {
  value: string
  onChange: (value: string) => void
  max?: string
  min?: string
  required?: boolean
  icon?: React.ReactNode
  className?: string
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function CustomDatePicker({
  value,
  onChange,
  max,
  min,
  required = false,
  icon,
  className = '',
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date()
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value) : null
  const maxDate = max ? new Date(max) : null
  const minDate = min ? new Date(min) : null

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Get day of week for first day (0 = Sunday, convert to Monday = 0)
    let startDay = firstDay.getDay() - 1
    if (startDay < 0) startDay = 6

    const days: (Date | null)[] = []

    // Add empty slots for days before the first day
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isDateDisabled = (date: Date) => {
    if (maxDate && date > maxDate) return true
    if (minDate && date < minDate) return true
    return false
  }

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return
    const formatted = date.toISOString().split('T')[0]
    onChange(formatted)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const handleToday = () => {
    const today = new Date()
    if (!isDateDisabled(today)) {
      onChange(today.toISOString().split('T')[0])
      setIsOpen(false)
    }
  }

  const days = getDaysInMonth(viewDate)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 px-4 py-3.5
          bg-[hsl(var(--card))] border-2 rounded-xl
          text-left transition-all duration-200
          ${isOpen
            ? 'border-[hsl(var(--primary-500))] ring-4 ring-[hsl(var(--primary-100))]'
            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary-300))]'
          }
          ${!value ? 'text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--foreground))]'}
        `}
      >
        {icon && (
          <span className={`flex-shrink-0 transition-colors ${isOpen ? 'text-[hsl(var(--primary-500))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
            {icon}
          </span>
        )}
        <span className="flex-1 truncate font-medium">
          {value ? formatDisplayDate(value) : 'Datum auswählen...'}
        </span>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-[hsl(var(--primary-500))]`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="
            absolute z-50 mt-2 p-4
            bg-[hsl(var(--card))] border-2 border-[hsl(var(--primary-200))]
            rounded-2xl shadow-2xl
            min-w-[300px]
          "
          style={{
            animation: 'dropdown-open 0.2s ease-out',
          }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--primary-100))] flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-semibold text-[hsl(var(--foreground))]">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--primary-100))] flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-sm font-medium text-[hsl(var(--muted-foreground))]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isDateDisabled(date)}
                    className={`
                      w-full h-full rounded-xl text-sm font-medium
                      transition-all duration-150
                      flex items-center justify-center
                      ${isDateDisabled(date)
                        ? 'text-[hsl(var(--muted-foreground))] opacity-40 cursor-not-allowed'
                        : isSameDay(date, selectedDate)
                          ? 'bg-[hsl(var(--primary-500))] text-white shadow-lg'
                          : isToday(date)
                            ? 'bg-[hsl(var(--primary-100))] text-[hsl(var(--primary-700))] font-bold'
                            : 'hover:bg-[hsl(var(--primary-50))] text-[hsl(var(--foreground))]'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--error))] transition-colors"
            >
              Löschen
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-sm font-medium text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))] transition-colors"
            >
              Heute
            </button>
          </div>
        </div>
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
