'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react'

interface CustomDatePickerProps {
  value: string
  onChange: (value: string) => void
  max?: string
  min?: string
  required?: boolean
  icon?: React.ReactNode
  className?: string
  placeholder?: string
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
  placeholder = 'Datum auswählen...',
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date()
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value) : null
  const maxDate = max ? new Date(max) : null
  const minDate = min ? new Date(min) : null

  // Lock body scroll when open
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

    let startDay = firstDay.getDay() - 1
    if (startDay < 0) startDay = 6

    const days: (Date | null)[] = []

    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

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
      setViewDate(today)
    }
  }

  const days = getDaysInMonth(viewDate)

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`
            w-full flex items-center gap-2 px-3 py-2.5
            bg-slate-50 border rounded-xl
            text-left transition-all duration-200
            ${isOpen
              ? 'border-purple-400 ring-2 ring-purple-100'
              : 'border-slate-200'
            }
            ${!value ? 'text-slate-400' : 'text-slate-900'}
          `}
        >
          {icon && (
            <span className={`flex-shrink-0 transition-colors ${isOpen ? 'text-purple-500' : 'text-slate-400'}`}>
              {icon}
            </span>
          )}
          <span className="flex-1 truncate text-sm">
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
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

      {/* Full-screen Calendar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet Calendar */}
          <div
            className="
              absolute bottom-0 left-0 right-0
              bg-white rounded-t-3xl
              max-h-[85vh] overflow-hidden
              animate-slide-up
            "
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Datum wählen</h3>
              <button
                type="button"
                onClick={handleToday}
                className="text-sm font-medium text-purple-600 active:text-purple-700"
              >
                Heute
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-10 h-10 rounded-xl bg-slate-100 active:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <span className="font-semibold text-slate-900">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-10 h-10 rounded-xl bg-slate-100 active:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 px-4">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="h-10 flex items-center justify-center text-sm font-medium text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 px-4 pb-4">
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
                          ? 'text-slate-300 cursor-not-allowed'
                          : isSameDay(date, selectedDate)
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                            : isToday(date)
                              ? 'bg-purple-100 text-purple-700 font-bold'
                              : 'active:bg-purple-50 text-slate-900'
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl active:bg-slate-200 transition-colors"
              >
                Löschen
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 bg-purple-500 text-white font-semibold rounded-xl active:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Fertig
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
      `}</style>
    </>
  )
}
