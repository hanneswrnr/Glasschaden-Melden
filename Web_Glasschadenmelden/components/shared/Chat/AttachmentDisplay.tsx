'use client'

import { useState } from 'react'
import { Download, FileText, File, Image as ImageIcon, X, ExternalLink } from 'lucide-react'
import { MessageAttachment } from '@/lib/supabase/database.types'
import { getSupabaseClient } from '@/lib/supabase/client'

interface AttachmentDisplayProps {
  attachment: MessageAttachment
  isOwn: boolean
}

export function AttachmentDisplay({ attachment, isOwn }: AttachmentDisplayProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = getSupabaseClient()

  const isImage = attachment.file_type.startsWith('image/')
  const isPdf = attachment.file_type === 'application/pdf'

  const getFileIcon = () => {
    if (isImage) return ImageIcon
    if (isPdf) return FileText
    return File
  }

  const FileIcon = getFileIcon()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const loadImage = async () => {
    if (imageUrl) {
      setIsLightboxOpen(true)
      return
    }

    setIsLoading(true)
    const { data } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(attachment.file_path, 3600) // 1 hour expiry

    if (data?.signedUrl) {
      setImageUrl(data.signedUrl)
      setIsLightboxOpen(true)
    }
    setIsLoading(false)
  }

  const handleDownload = async () => {
    const { data } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(attachment.file_path, 3600)

    if (data?.signedUrl) {
      const link = document.createElement('a')
      link.href = data.signedUrl
      link.download = attachment.file_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (isImage) {
    return (
      <>
        <button
          onClick={loadImage}
          disabled={isLoading}
          className={`block rounded-lg overflow-hidden border ${
            isOwn ? 'border-slate-700' : 'border-slate-200'
          } hover:opacity-90 transition-opacity`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={attachment.file_name}
              className="max-w-[200px] max-h-[150px] object-cover"
            />
          ) : (
            <div className={`w-[150px] h-[100px] flex flex-col items-center justify-center ${
              isOwn ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ImageIcon className={`w-8 h-8 mb-1 ${isOwn ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span className={`text-xs ${isOwn ? 'text-slate-400' : 'text-slate-500'}`}>
                    Bild laden
                  </span>
                </>
              )}
            </div>
          )}
        </button>

        {/* Lightbox */}
        {isLightboxOpen && imageUrl && (
          <div
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={imageUrl}
              alt={attachment.file_name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <span className="text-white text-sm">{attachment.file_name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload()
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // Non-image file
  return (
    <button
      onClick={handleDownload}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
        isOwn
          ? 'border-slate-700 bg-slate-800 hover:bg-slate-700'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      } transition-colors`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        isOwn ? 'bg-slate-700' : 'bg-slate-100'
      }`}>
        <FileIcon className={`w-5 h-5 ${isOwn ? 'text-slate-300' : 'text-slate-500'}`} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-slate-900'}`}>
          {attachment.file_name}
        </p>
        <p className={`text-xs ${isOwn ? 'text-slate-400' : 'text-slate-500'}`}>
          {formatFileSize(attachment.file_size)}
        </p>
      </div>
      <Download className={`w-4 h-4 flex-shrink-0 ${isOwn ? 'text-slate-400' : 'text-slate-400'}`} />
    </button>
  )
}
