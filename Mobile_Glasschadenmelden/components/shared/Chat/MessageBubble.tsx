'use client'

import { ChatMessage, CHAT_ROLE_COLORS, UserRole } from '@/lib/supabase/database.types'
import { AttachmentDisplay } from './AttachmentDisplay'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showSender: boolean
}

const ROLE_LABELS: Record<UserRole, string> = {
  werkstatt: 'Werkstatt',
  versicherung: 'Versicherung',
  admin: 'Administrator'
}

export function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  const senderRole = message.sender?.role || 'versicherung'
  const roleColors = CHAT_ROLE_COLORS[senderRole]
  const senderName = message.sender?.display_name || message.sender?.company_name || ROLE_LABELS[senderRole]
  const senderAddress = message.sender?.address
  // Format: "Name - Adresse" or just "Name" if no address
  const senderDisplay = senderAddress ? `${senderName} - ${senderAddress}` : senderName

  const time = new Date(message.created_at).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const isTemp = message.id.startsWith('temp-')

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender info */}
        {showSender && !isOwn && (
          <div className="flex items-center gap-2 mb-1 ml-1 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors.badge}`}>
              {ROLE_LABELS[senderRole]}
            </span>
            {senderRole !== 'admin' && (
              <span className="text-xs text-slate-500">{senderDisplay}</span>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-slate-900 text-white rounded-br-md'
              : `${roleColors.bg} ${roleColors.text} rounded-bl-md`
          } ${isTemp ? 'opacity-70' : ''}`}
        >
          {/* Message text */}
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <AttachmentDisplay
                  key={attachment.id}
                  attachment={attachment}
                  isOwn={isOwn}
                />
              ))}
            </div>
          )}

          {/* Time */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isOwn ? 'text-slate-400' : 'text-slate-500'}`}>
              {time}
            </span>
            {isTemp && (
              <span className={`text-[10px] ${isOwn ? 'text-slate-400' : 'text-slate-500'}`}>
                Wird gesendet...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
