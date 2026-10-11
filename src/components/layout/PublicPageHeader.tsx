'use client'

import { Button } from '@/components/ui/button'
import { Globe, Wrench } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

interface PublicPageHeaderProps {
  showMaintenanceButton?: boolean
}

/**
 * Shared header component for public pages (Login, Request, Complete)
 * Provides consistent positioning of language switcher and maintenance request button
 * Language button is always in top-right corner (LTR perspective)
 * Maintenance button only appears on login page, in top-left corner
 */
export function PublicPageHeader({ showMaintenanceButton = false }: PublicPageHeaderProps) {
  const { language, toggleLanguage } = useLanguage()
  const router = useRouter()

  return (
    <div className="fixed top-0 left-0 right-0 z-20 px-4 py-4 bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Left side: Maintenance Request Button (only on login page) */}
        <div>
          {showMaintenanceButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/request')}
              className="gap-2 bg-white hover:bg-white/95 border-white/20 text-slate-700 hover:text-slate-900 shadow-md hover:shadow-lg backdrop-blur-sm"
            >
              <Wrench className="h-4 w-4" />
              {language === 'ar' ? 'طلب صيانة' : 'Maintenance Request'}
            </Button>
          )}
        </div>

        {/* Right side: Language Switcher (always visible, always in same position) */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="gap-2 bg-white hover:bg-white/95 border-white/20 text-slate-700 hover:text-slate-900 shadow-md hover:shadow-lg backdrop-blur-sm"
        >
          <Globe className="h-4 w-4" />
          {language === 'ar' ? 'English' : 'العربية'}
        </Button>
      </div>
    </div>
  )
}
