import { useLanguage } from '@/contexts/LanguageContext'
import { translations, type Language } from '@/lib/translations'

export function useTranslation() {
  const { language } = useLanguage()

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        // Fallback to Arabic if key not found
        value = translations.ar
        for (const k of keys) {
          if (value && typeof value === 'object') {
            value = value[k]
          }
        }
        break
      }
    }

    return typeof value === 'string' ? value : key
  }

  return { t, language }
}
