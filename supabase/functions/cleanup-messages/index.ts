// ============================================
// GLASSCHADEN MELDEN - CLEANUP MESSAGES EDGE FUNCTION
// Löscht Nachrichten 14 Tage nach Claim-Abschluss
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
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const claimIds = eligibleClaims.map((c) => c.id)

    // Lösche Nachrichten dieser Claims
    const { data: deletedMessages, error: deleteError } = await supabase
      .from('claim_messages')
      .delete()
      .in('claim_id', claimIds)
      .select('id')

    if (deleteError) {
      throw new Error(`Fehler beim Löschen: ${deleteError.message}`)
    }

    const deletedCount = deletedMessages?.length || 0

    // Log für Audit
    console.log(`[Cleanup] ${deletedCount} Nachrichten von ${claimIds.length} Claims gelöscht.`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${deletedCount} Nachrichten erfolgreich gelöscht.`,
        deleted_count: deletedCount,
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
