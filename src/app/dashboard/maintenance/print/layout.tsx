'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isRTL } = useLanguage()

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  )
}
