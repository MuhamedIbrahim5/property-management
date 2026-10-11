'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'ar' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load language from localStorage or cookie on mount
    const savedLanguage = localStorage.getItem('language') as Language
    const cookieLanguage = document.cookie
      .split('; ')
      .find(row => row.startsWith('language='))
      ?.split('=')[1] as Language
    
    const lang = savedLanguage || cookieLanguage || 'ar'
    if (lang === 'ar' || lang === 'en') {
      setLanguageState(lang)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      // Save language to localStorage
      localStorage.setItem('language', language)
      
      // Save language to cookie for server components
      document.cookie = `language=${language}; path=/; max-age=31536000; SameSite=Lax`
      
      // Update document direction and lang attribute
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = language
    }
  }, [language, mounted])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'ar' ? 'en' : 'ar')
  }

  const isRTL = language === 'ar'

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
