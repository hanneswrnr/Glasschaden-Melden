'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { MessageCircle, AlertCircle, Clock } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ChatMessage, MessageAttachment, UserRole, CHAT_ROLE_COLORS } from '@/lib/supabase/database.types'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface ChatContainerProps {
  claimId: string
  currentUserId: string
  userRole: UserRole
  completedAt?: string | null
  isReadOnly?: boolean
}

export function ChatContainer({
  claimId,
  currentUserId,
  userRole,
  completedAt,
  isReadOnly = false
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseClient()

  // Calculate days until deletion
  const daysUntilDeletion = completedAt
    ? Math.max(0, 14 - Math.floor((Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : null

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load messages
  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('claim_messages')
      .select(`
        id,
        claim_id,
        sender_id,
        message,
        created_at
      `)
      .eq('claim_id', claimId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      return
    }

    if (data) {
      // Load sender info and attachments for each message
      const messagesWithDetails = await Promise.all(
        data.map(async (msg) => {
          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, company_name, role')
            .eq('id', msg.sender_id)
            .single()

          // Get attachments
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('*')
            .eq('message_id', msg.id)

          return {
            ...msg,
            sender: profile || undefined,
            attachments: attachments || []
          } as ChatMessage
        })
      )

      setMessages(messagesWithDetails)
      setTimeout(scrollToBottom, 100)
    }

    setIsLoading(false)
  }, [claimId, supabase, scrollToBottom])

  // Setup realtime subscription
  useEffect(() => {
    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${claimId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'claim_messages',
          filter: `claim_id=eq.${claimId}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage

          // Only add if not from current user (they already have it via optimistic update)
          if (newMessage.sender_id !== currentUserId) {
            // Get sender profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, company_name, role')
              .eq('id', newMessage.sender_id)
              .single()

            // Get attachments
            const { data: attachments } = await supabase
              .from('message_attachments')
              .select('*')
              .eq('message_id', newMessage.id)

            setMessages(prev => [...prev, {
              ...newMessage,
              sender: profile || undefined,
              attachments: attachments || []
            }])

            scrollToBottom()

            // Show notification for new message
            if (profile) {
              const senderName = profile.display_name || profile.company_name || 'Unbekannt'
              toast.info(`Neue Nachricht von ${senderName}`)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [claimId, currentUserId, supabase, loadMessages, scrollToBottom])

  // Send message
  const handleSendMessage = async (text: string, attachments?: File[]) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return

    setIsSending(true)

    try {
      // Get current user's profile for optimistic update
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, company_name, role')
        .eq('id', currentUserId)
        .single()

      // Optimistic update
      const tempId = `temp-${Date.now()}`
      const tempMessage: ChatMessage = {
        id: tempId,
        claim_id: claimId,
        sender_id: currentUserId,
        message: text,
        created_at: new Date().toISOString(),
        sender: profile || undefined,
        attachments: []
      }

      setMessages(prev => [...prev, tempMessage])
      scrollToBottom()

      // Insert message to database
      const { data: newMessage, error: messageError } = await supabase
        .from('claim_messages')
        .insert({
          claim_id: claimId,
          sender_id: currentUserId,
          message: text
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Upload attachments if any
      const uploadedAttachments: MessageAttachment[] = []
      if (attachments && attachments.length > 0 && newMessage) {
        for (const file of attachments) {
          const filePath = `${claimId}/${newMessage.id}/${file.name}`

          const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            continue
          }

          // Save attachment record
          const { data: attachment, error: attachmentError } = await supabase
            .from('message_attachments')
            .insert({
              message_id: newMessage.id,
              file_path: filePath,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size
            })
            .select()
            .single()

          if (!attachmentError && attachment) {
            uploadedAttachments.push(attachment)
          }
        }
      }

      // Update the optimistic message with real data
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? {
            ...newMessage,
            sender: profile || undefined,
            attachments: uploadedAttachments
          }
          : msg
      ))

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Nachricht konnte nicht gesendet werden')
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
    } finally {
      setIsSending(false)
    }
  }

  const roleColors = CHAT_ROLE_COLORS[userRole]

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 md:px-6 md:py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${roleColors.badge.split(' ')[0]} flex items-center justify-center`}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">
              Chat
              {userRole === 'werkstatt' && ' mit Versicherung'}
              {userRole === 'versicherung' && ' mit Werkstatt'}
              {userRole === 'admin' && ' (Alle Nachrichten)'}
            </h3>
            <p className="text-xs text-slate-500">
              {messages.length} Nachricht{messages.length !== 1 ? 'en' : ''}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Chat Content */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          {/* Deletion Warning */}
          {isReadOnly && daysUntilDeletion !== null && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Dieser Auftrag ist abgeschlossen. Der Chat wird in <span className="font-semibold">{daysUntilDeletion} Tag{daysUntilDeletion !== 1 ? 'en' : ''}</span> gelöscht.
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="h-[300px] md:h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm font-medium">Noch keine Nachrichten</p>
                <p className="text-xs">Starten Sie die Konversation</p>
              </div>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                messagesEndRef={messagesEndRef}
              />
            )}
          </div>

          {/* Input */}
          {!isReadOnly ? (
            <MessageInput
              onSend={handleSendMessage}
              isSending={isSending}
              userRole={userRole}
            />
          ) : (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-2 text-slate-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Chat ist geschlossen (Auftrag abgeschlossen)</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
