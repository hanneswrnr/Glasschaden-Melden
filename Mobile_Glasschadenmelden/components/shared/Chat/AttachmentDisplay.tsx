'use client'

import { useState } from 'react'
import { FileText, File, Download, X, Image as ImageIcon } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { MessageAttachment } from '@/lib/supabase/database.types'

interface AttachmentDisplayProps {
  attachment: MessageAttachment
  isOwn: boolean
}

export function AttachmentDisplay({ attachment, isOwn }: AttachmentDisplayProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const supabase = getSupabaseClient()

  const isImage = attachment.file_type.startsWith('image/')

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(attachment.file_path, 60) // 60 seconds validity

      if (error) throw error

      if (data?.signedUrl) {
        // Open in new tab or download
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageClick = async () => {
    if (!isImage) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(attachment.file_path, 300) // 5 minutes validity

      if (error) throw error

      if (data?.signedUrl) {
        setImageUrl(data.signedUrl)
        setShowLightbox(true)
      }
    } catch (error) {
      console.error('Error loading image:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = () => {
    if (isImage) return ImageIcon
    if (attachment.file_type === 'application/pdf') return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const FileIcon = getFileIcon()

  return (
    <>
      <button
        onClick={isImage ? handleImageClick : handleDownload}
        disabled={isLoading}
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
          isOwn
            ? 'bg-white/10 hover:bg-white/20 active:bg-white/30'
            : 'bg-black/5 hover:bg-black/10 active:bg-black/15'
        } ${isLoading ? 'opacity-50' : ''}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isOwn ? 'bg-white/20' : 'bg-black/10'
        }`}>
          {isLoading ? (
            <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
              isOwn ? 'border-white/30 border-t-white' : 'border-slate-300 border-t-slate-600'
            }`} />
          ) : (
            <FileIcon className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-slate-600'}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-xs font-medium truncate ${isOwn ? 'text-white' : 'text-slate-700'}`}>
            {attachment.file_name}
          </p>
          <p className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-500'}`}>
            {formatFileSize(attachment.file_size)}
          </p>
        </div>
        <Download className={`w-4 h-4 flex-shrink-0 ${isOwn ? 'text-white/60' : 'text-slate-400'}`} />
      </button>

      {/* Lightbox for images */}
      {showLightbox && imageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={imageUrl}
            alt={attachment.file_name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-white text-sm font-medium">{attachment.file_name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
              className="mt-2 px-4 py-2 bg-white/20 rounded-lg text-white text-sm active:bg-white/30"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Herunterladen
            </button>
          </div>
        </div>
      )}
    </>
  )
}
