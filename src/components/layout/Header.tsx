'use client'

import { useState } from 'react'
import { User, LogOut, Settings, Menu, Globe } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTranslation } from '@/hooks/useTranslation'

interface HeaderProps {
  onMenuClick: () => void
}

// Translation mapping for default system user names
const defaultUserNames: Record<string, { ar: string; en: string }> = {
  'مدير النظام': { ar: 'مدير النظام', en: 'System Administrator' },
  'محمود فريد': { ar: 'محمود فريد', en: 'Mahmoud Farid' },
  'ياسر الحامضي': { ar: 'ياسر الحامضي', en: 'Yasser Al-Hamdi' },
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toggleLanguage, language, isRTL } = useLanguage()
  const { t } = useTranslation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Translate user name if it's a default system name
  const getTranslatedUserName = (name: string | null | undefined): string => {
    if (!name) return t('auth.myAccount')
    
    // Check if it's a default system name
    const defaultName = defaultUserNames[name]
    if (defaultName) {
      return language === 'ar' ? defaultName.ar : defaultName.en
    }
    
    // Return custom name as-is
    return name
  }

  // Translate user role
  const getTranslatedRole = (role: string | undefined): string => {
    if (!role) return ''
    
    const roleTranslations: Record<string, { ar: string; en: string }> = {
      'admin': { ar: 'مدير', en: 'Admin' },
      'manager': { ar: 'مدير تنفيذي', en: 'Manager' },
      'technician': { ar: 'فني', en: 'Technician' },
      'viewer': { ar: 'مشاهد', en: 'Viewer' },
    }
    
    const translation = roleTranslations[role.toLowerCase()]
    if (translation) {
      return language === 'ar' ? translation.ar : translation.en
    }
    
    return role
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleToggleLanguage = () => {
    toggleLanguage()
    // Refresh to update server components
    setTimeout(() => router.refresh(), 100)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6 shadow-sm">
      {/* زر القائمة للموبايل */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-foreground">
            {t('common.welcomeBack')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            {t('auth.systemTitle')}
          </p>
        </div>
      </div>
      
      <div className="relative flex items-center gap-2">
        {/* Language Toggle Button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleToggleLanguage}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {language === 'ar' ? 'English' : 'العربية'}
          </span>
        </Button>

        {/* User Menu Button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="relative"
        >
          <User className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        {showUserMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowUserMenu(false)}
            />
            
            {/* Menu */}
            <div className={`absolute top-full z-50 mt-2 w-64 rounded-lg border border-border bg-white shadow-lg ${isRTL ? 'left-0' : 'right-0'}`}>
              <div className="border-b border-border p-4">
                <p className="font-semibold text-foreground">{getTranslatedUserName(session?.user?.name)}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email || ''}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('auth.role')}: {getTranslatedRole(session?.user?.role)}
                </p>
              </div>
              
              <div className="p-2">
                <a
                  href="/dashboard/account"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>{t('auth.myAccount')}</span>
                </a>
                
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('auth.logout')}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
