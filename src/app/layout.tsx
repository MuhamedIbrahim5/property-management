import type { Metadata } from 'next'
import AuthSessionProvider from '@/components/providers/SessionProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'نظام إدارة الأملاك والصيانة',
  description: 'نظام متكامل لإدارة العقارات والوحدات وبلاغات الصيانة',
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
    <html lang="ar" dir="rtl">
      <body className="font-arabic antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
