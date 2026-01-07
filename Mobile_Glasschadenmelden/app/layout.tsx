import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { BottomNavigation } from '@/components/mobile/BottomNavigation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4F46E5',
}

export const metadata: Metadata = {
  title: 'Glasschaden Melden',
  description: 'Professionelle Glasschaden-Verwaltung für Versicherungen und Werkstätten',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="pb-24">
          {children}
        </div>
        <BottomNavigation />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e2e8f0',
            },
          }}
        />
      </body>
    </html>
  )
}
