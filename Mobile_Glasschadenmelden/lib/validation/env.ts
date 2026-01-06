import { z } from 'zod'

/**
 * Zod Schema für Environment Variables
 * Validiert alle benötigten API Keys beim App-Start
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL muss eine gültige URL sein')
    .refine(
      (url) => url.includes('supabase.co'),
      'NEXT_PUBLIC_SUPABASE_URL muss eine Supabase URL sein'
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(30, 'NEXT_PUBLIC_SUPABASE_ANON_KEY ist ungültig'),
})

/**
 * Validierte Environment Variables
 * Wirft einen Fehler, wenn Variablen fehlen oder ungültig sind
 */
function validateEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  if (!parsed.success) {
    console.error('❌ Ungültige Environment Variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Environment Validation fehlgeschlagen')
  }

  return parsed.data
}

export const env = validateEnv()

export type Env = z.infer<typeof envSchema>
