import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Supabase Client für Client-Komponenten (Browser)
 * Verwendet für:
 * - Auth State Management
 * - Real-time Subscriptions
 * - Client-side Data Fetching
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Singleton Client für einfachen Import
 */
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
