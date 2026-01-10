'use client'

import { RefObject } from 'react'
import { ChatMessage, CHAT_ROLE_COLORS } from '@/lib/supabase/database.types'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  messagesEndRef: RefObject<HTMLDivElement>
}

export function MessageList({ messages, currentUserId, messagesEndRef }: MessageListProps) {
  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = []
  let currentDate = ''

  messages.forEach((message) => {
    const messageDate = new Date(message.created_at).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    if (messageDate !== currentDate) {
      currentDate = messageDate
      groupedMessages.push({ date: messageDate, messages: [message] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message)
    }
  })

  return (
    <div className="p-4 space-y-4">
      {groupedMessages.map((group, groupIndex) => (
        <div key={group.date}>
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full">
              {group.date}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-3">
            {group.messages.map((message, messageIndex) => {
              const isOwn = message.sender_id === currentUserId
              const showSender = messageIndex === 0 ||
                group.messages[messageIndex - 1].sender_id !== message.sender_id

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showSender={showSender}
                />
              )
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
