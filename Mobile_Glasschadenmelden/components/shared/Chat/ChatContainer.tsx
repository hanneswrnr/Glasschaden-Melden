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

  // Chat is only read-only after 14 days have passed since completion
  // (unless explicitly set to read-only via prop, e.g., for admin override)
  const effectiveIsReadOnly = isReadOnly && completedAt
    ? daysUntilDeletion === 0
    : false

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Helper function to get sender info based on role
  const getSenderInfo = async (senderId: string, role: string) => {
    let displayName = 'Unbekannt'
    let address = ''

    if (role === 'versicherung') {
      const { data: versicherung } = await supabase
        .from('versicherungen')
        .select('firma, adresse')
        .eq('user_id', senderId)
        .single()
      if (versicherung) {
        displayName = versicherung.firma
        address = versicherung.adresse
      }
    } else if (role === 'werkstatt') {
      // Get the primary standort of the werkstatt
      const { data: werkstatt } = await supabase
        .from('werkstaetten')
        .select('id')
        .eq('user_id', senderId)
        .single()
      if (werkstatt) {
        const { data: standort } = await supabase
          .from('werkstatt_standorte')
          .select('name, adresse')
          .eq('werkstatt_id', werkstatt.id)
          .eq('is_primary', true)
          .single()
        if (standort) {
          displayName = standort.name
          address = standort.adresse
        }
      }
    } else if (role === 'admin') {
      displayName = 'Administrator'
    }

    return { displayName, address }
  }

  // Load messages
  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('claim_messages')
      .select(`
        id,
        claim_id,
        sender_id,
        message,
        created_at,
        sender_role,
        sender_name,
        sender_address
      `)
      .eq('claim_id', claimId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      return
    }

    if (data) {
      // Load attachments for each message - sender info is now stored in the message itself
      const messagesWithDetails = await Promise.all(
        data.map(async (msg: {
          id: string
          claim_id: string
          sender_id: string
          message: string
          created_at: string
          sender_role: string | null
          sender_name: string | null
          sender_address: string | null
        }) => {
          // Get attachments
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('*')
            .eq('message_id', msg.id)

          // Use stored sender info from message (no profile query needed)
          return {
            ...msg,
            sender: msg.sender_role ? {
              id: msg.sender_id,
              display_name: msg.sender_name || 'Unbekannt',
              company_name: msg.sender_name || 'Unbekannt',
              address: msg.sender_address || '',
              role: msg.sender_role as UserRole
            } : undefined,
            attachments: attachments || []
          } as ChatMessage
        })
      )

      setMessages(messagesWithDetails)
      // Don't auto-scroll on initial load - user might want to read from top
    }

    setIsLoading(false)
  }, [claimId, supabase])

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
          const newMessage = payload.new as {
            id: string
            claim_id: string
            sender_id: string
            message: string
            created_at: string
            sender_role: string | null
            sender_name: string | null
            sender_address: string | null
          }

          // Only add if not from current user (they already have it via optimistic update)
          if (newMessage.sender_id !== currentUserId) {
            // Get attachments
            const { data: attachments } = await supabase
              .from('message_attachments')
              .select('*')
              .eq('message_id', newMessage.id)

            // Use sender info stored in the message (no profile query needed)
            setMessages(prev => [...prev, {
              ...newMessage,
              sender: newMessage.sender_role ? {
                id: newMessage.sender_id,
                display_name: newMessage.sender_name || 'Unbekannt',
                company_name: newMessage.sender_name || 'Unbekannt',
                address: newMessage.sender_address || '',
                role: newMessage.sender_role as UserRole
              } : undefined,
              attachments: attachments || []
            }])

            scrollToBottom()

            // Show notification for new message
            toast.info(`Neue Nachricht von ${newMessage.sender_name || 'Unbekannt'}`)
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
        .select('id, role')
        .eq('id', currentUserId)
        .single()

      // Get actual sender info
      let senderInfo = { displayName: 'Unbekannt', address: '' }
      if (profile) {
        senderInfo = await getSenderInfo(currentUserId, profile.role)
      }

      // Optimistic update
      const tempId = `temp-${Date.now()}`
      const tempMessage: ChatMessage = {
        id: tempId,
        claim_id: claimId,
        sender_id: currentUserId,
        message: text,
        created_at: new Date().toISOString(),
        sender: profile ? {
          id: profile.id,
          display_name: senderInfo.displayName,
          company_name: senderInfo.displayName,
          address: senderInfo.address,
          role: profile.role
        } : undefined,
        attachments: []
      }

      setMessages(prev => [...prev, tempMessage])
      scrollToBottom()

      // Insert message to database with sender info
      const { data: newMessage, error: messageError } = await supabase
        .from('claim_messages')
        .insert({
          claim_id: claimId,
          sender_id: currentUserId,
          message: text,
          sender_role: profile?.role || userRole,
          sender_name: senderInfo.displayName,
          sender_address: senderInfo.address
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
            sender: profile ? {
              id: profile.id,
              display_name: senderInfo.displayName,
              company_name: senderInfo.displayName,
              address: senderInfo.address,
              role: profile.role
            } : undefined,
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
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 active:bg-slate-100 transition-colors"
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
          {/* Deletion Warning - show when claim is completed, even if chat is still active */}
          {isReadOnly && daysUntilDeletion !== null && daysUntilDeletion > 0 && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Dieser Auftrag ist abgeschlossen. Der Chat wird in <span className="font-semibold">{daysUntilDeletion} Tag{daysUntilDeletion !== 1 ? 'en' : ''}</span> gelöscht.
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="h-[300px] overflow-y-auto">
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
          {!effectiveIsReadOnly ? (
            <MessageInput
              onSend={handleSendMessage}
              isSending={isSending}
              userRole={userRole}
            />
          ) : (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-2 text-slate-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Chat ist geschlossen (14 Tage nach Abschluss erreicht)</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
