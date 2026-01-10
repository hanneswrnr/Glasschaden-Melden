// ============================================
// GLASSCHADEN MELDEN - CLEANUP MESSAGES EDGE FUNCTION
// Löscht Nachrichten und Anhänge 14 Tage nach Claim-Abschluss
// ============================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Erstelle Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Berechne Datum: 14 Tage vor heute
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 14)

    // Finde Claims die abgeschlossen sind und deren completed_at > 14 Tage
    const { data: eligibleClaims, error: claimsError } = await supabase
      .from('claims')
      .select('id')
      .eq('status', 'abgeschlossen')
      .lt('completed_at', cutoffDate.toISOString())

    if (claimsError) {
      throw new Error(`Fehler beim Laden der Claims: ${claimsError.message}`)
    }

    if (!eligibleClaims || eligibleClaims.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Keine Nachrichten zum Löschen gefunden.',
          deleted_count: 0,
          deleted_files: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const claimIds = eligibleClaims.map((c) => c.id)

    // Finde alle Nachrichten der Claims
    const { data: messages, error: messagesError } = await supabase
      .from('claim_messages')
      .select('id')
      .in('claim_id', claimIds)

    if (messagesError) {
      throw new Error(`Fehler beim Laden der Nachrichten: ${messagesError.message}`)
    }

    const messageIds = messages?.map((m) => m.id) || []
    let deletedFilesCount = 0

    // Lösche Storage-Dateien für jeden Claim
    for (const claimId of claimIds) {
      try {
        // Liste alle Dateien im Claim-Ordner
        const { data: files, error: listError } = await supabase.storage
          .from('chat-attachments')
          .list(claimId, { limit: 1000 })

        if (listError) {
          console.error(`[Cleanup] Fehler beim Listen von Dateien für Claim ${claimId}:`, listError)
          continue
        }

        if (files && files.length > 0) {
          // Hole alle Dateien rekursiv (inklusive Unterordner)
          const filesToDelete: string[] = []

          for (const file of files) {
            if (file.id) {
              // Es ist eine Datei
              filesToDelete.push(`${claimId}/${file.name}`)
            } else {
              // Es ist ein Ordner (message_id), liste dessen Inhalt
              const { data: subFiles, error: subListError } = await supabase.storage
                .from('chat-attachments')
                .list(`${claimId}/${file.name}`, { limit: 100 })

              if (!subListError && subFiles) {
                for (const subFile of subFiles) {
                  if (subFile.id) {
                    filesToDelete.push(`${claimId}/${file.name}/${subFile.name}`)
                  }
                }
              }
            }
          }

          if (filesToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage
              .from('chat-attachments')
              .remove(filesToDelete)

            if (deleteError) {
              console.error(`[Cleanup] Fehler beim Löschen von Dateien für Claim ${claimId}:`, deleteError)
            } else {
              deletedFilesCount += filesToDelete.length
              console.log(`[Cleanup] ${filesToDelete.length} Dateien für Claim ${claimId} gelöscht.`)
            }
          }
        }
      } catch (storageError) {
        console.error(`[Cleanup] Storage-Fehler für Claim ${claimId}:`, storageError)
      }
    }

    // Lösche Nachrichten dieser Claims (CASCADE löscht auch message_attachments)
    const { data: deletedMessages, error: deleteError } = await supabase
      .from('claim_messages')
      .delete()
      .in('claim_id', claimIds)
      .select('id')

    if (deleteError) {
      throw new Error(`Fehler beim Löschen der Nachrichten: ${deleteError.message}`)
    }

    const deletedCount = deletedMessages?.length || 0

    // Log für Audit
    console.log(`[Cleanup] ${deletedCount} Nachrichten und ${deletedFilesCount} Dateien von ${claimIds.length} Claims gelöscht.`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${deletedCount} Nachrichten und ${deletedFilesCount} Dateien erfolgreich gelöscht.`,
        deleted_count: deletedCount,
        deleted_files: deletedFilesCount,
        affected_claims: claimIds.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Cleanup Error]', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
