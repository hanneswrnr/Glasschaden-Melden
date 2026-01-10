'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, X, Image, FileText, File } from 'lucide-react'
import { UserRole, CHAT_ROLE_COLORS } from '@/lib/supabase/database.types'

interface MessageInputProps {
  onSend: (message: string, attachments?: File[]) => Promise<void>
  isSending: boolean
  userRole: UserRole
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export function MessageInput({ onSend, isSending, userRole }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const roleColors = CHAT_ROLE_COLORS[userRole]

  const handleSubmit = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending) return

    await onSend(message.trim(), attachments.length > 0 ? attachments : undefined)
    setMessage('')
    setAttachments([])

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const validFiles = files.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`Dateityp nicht erlaubt: ${file.name}`)
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`Datei zu groß (max 5MB): ${file.name}`)
        return false
      }
      return true
    })

    setAttachments(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 files

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type === 'application/pdf') return FileText
    return File
  }

  const canSend = (message.trim() || attachments.length > 0) && !isSending

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => {
            const FileIcon = getFileIcon(file.type)
            const isImage = file.type.startsWith('image/')

            return (
              <div
                key={index}
                className="relative group bg-slate-100 rounded-lg overflow-hidden"
              >
                {isImage ? (
                  <div className="w-16 h-16 md:w-20 md:h-20">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center p-2">
                    <FileIcon className="w-6 h-6 text-slate-500 mb-1" />
                    <span className="text-[10px] text-slate-600 truncate w-full text-center">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 md:p-4 flex items-end gap-2">
        {/* File Input Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || attachments.length >= 5}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-5 h-5 text-slate-600" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            disabled={isSending}
            rows={1}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '150px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            canSend
              ? `${roleColors.badge} hover:opacity-90 active:scale-95`
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Helper text */}
      <div className="px-4 pb-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>Enter zum Senden, Shift+Enter für neue Zeile</span>
        <span>{attachments.length}/5 Anhänge</span>
      </div>
    </div>
  )
}
