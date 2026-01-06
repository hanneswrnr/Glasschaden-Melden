import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/supabase/server'

/**
 * Root Page - Redirects basierend auf Auth Status und Rolle
 */
export default async function Home() {
  const profile = await getCurrentProfile()

  if (!profile) {
    // Nicht eingeloggt -> Login
    redirect('/login')
  }

  // Redirect basierend auf Rolle
  switch (profile.role) {
    case 'admin':
      redirect('/admin')
    case 'versicherung':
      redirect('/versicherung')
    case 'werkstatt':
      redirect('/werkstatt')
    default:
      redirect('/login')
  }
}
