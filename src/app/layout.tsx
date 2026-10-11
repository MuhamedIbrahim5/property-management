import type { Metadata } from 'next'
import AuthSessionProvider from '@/components/providers/SessionProvider'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { LanguageWrapper } from '@/components/providers/LanguageWrapper'
import './globals.css'

export const metadata: Metadata = {
  title: 'نظام إدارة الأملاك والصيانة | Property Management System',
  description: 'نظام متكامل لإدارة العقارات والوحدات وبلاغات الصيانة | Complete system for property, unit and maintenance management',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body className="font-arabic antialiased">
        <LanguageProvider>
          <LanguageWrapper>
            <AuthSessionProvider>{children}</AuthSessionProvider>
          </LanguageWrapper>
        </LanguageProvider>
      </body>
    </html>
  )
}
