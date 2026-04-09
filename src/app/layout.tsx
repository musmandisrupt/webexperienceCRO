import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'CompetitorHQ',
  description: 'Internal tool for GTM team to collect and analyze competitor landing pages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1E293B',
              color: '#FFFFFF',
              border: '1px solid #22D3EE20',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#22D3EE', secondary: '#0A0F1C' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#0A0F1C' },
            },
          }}
        />
      </body>
    </html>
  )
}
