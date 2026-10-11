'use client'

import { useEffect, ReactNode } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * Client component that synchronizes language and direction with the document
 * This ensures RTL/LTR is applied correctly across the entire application
 */
export function LanguageWrapper({ children }: { children: ReactNode }) {
  const { language, isRTL } = useLanguage()

  useEffect(() => {
    // Apply language and direction to document root
    const html = document.documentElement
    html.lang = language
    html.dir = isRTL ? 'rtl' : 'ltr'

    // Add or remove RTL class for additional styling if needed
    if (isRTL) {
      html.classList.add('rtl')
      html.classList.remove('ltr')
    } else {
      html.classList.add('ltr')
      html.classList.remove('rtl')
    }
  }, [language, isRTL])

  return <>{children}</>
}
