'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, DoorOpen, Wrench, Settings, LogOut, X, FileText, Copy, CheckCircle2 } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { buildAppUrl } from '@/lib/url'
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { isRTL, language } = useLanguage()
  const [copied, setCopied] = useState(false)

  const navigation = [
    { name: t('sidebar.dashboard'), href: '/dashboard', icon: Home },
    { name: t('sidebar.properties'), href: '/dashboard/properties', icon: Building2 },
    { name: t('sidebar.units'), href: '/dashboard/units', icon: DoorOpen },
    { name: t('sidebar.maintenance'), href: '/dashboard/maintenance', icon: Wrench },
    { name: t('sidebar.settings'), href: '/dashboard/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const handleCopyRequestLink = async () => {
    const requestUrl = buildAppUrl('/request')
    try {
      await navigator.clipboard.writeText(requestUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Silently fail - user will notice button didn't change
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const requestUrl = buildAppUrl('/request')
  const isLocalhost = requestUrl.includes('localhost') || requestUrl.includes('127.0.0.1')

  return (
    <>
      {/* Backdrop للموبايل */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 z-50 h-screen w-64 bg-primary text-primary-foreground shadow-lg transition-transform duration-300 ease-in-out",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        "border-border/50",
        isOpen 
          ? "translate-x-0" 
          : isRTL 
            ? "translate-x-full lg:translate-x-0" 
            : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo و زر الإغلاق */}
          <div className={cn(
            "flex h-16 items-center justify-between border-b border-primary-foreground/10 px-4"
          )}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-xl font-bold shadow-md">
                🏢
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white">{t('auth.systemTitle')}</span>
                <span className="text-xs text-primary-foreground/70">{t('auth.systemSubtitle')}</span>
              </div>
            </div>
            
            {/* زر الإغلاق للموبايل */}
            <button
              onClick={onClose}
              className="lg:hidden rounded-lg p-1.5 text-primary-foreground/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">
              {t('sidebar.mainMenu')}
            </div>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-primary-foreground/90 hover:bg-white/15 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Public Request Link Section */}
            <div className="mt-4 pt-4 border-t border-primary-foreground/10">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">
                {language === 'ar' ? 'طلب عام' : 'Public Request'}
              </div>
              
              <a
                href={requestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/90 hover:bg-white/15 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <FileText className="h-5 w-5" />
                <span>{language === 'ar' ? 'تقديم بلاغ صيانة' : 'Submit Maintenance Request'}</span>
              </a>

              <button
                onClick={handleCopyRequestLink}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/90 hover:bg-white/15 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-good" />
                    <span className="text-good">{t('common.linkCopied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    <span>{t('common.copyLink')}</span>
                  </>
                )}
              </button>

              <Link
                href="/dashboard/maintenance/print"
                onClick={handleLinkClick}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/90 hover:bg-white/15 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <FileText className="h-5 w-5" />
                <span>{language === 'ar' ? 'إعلان الصيانة' : 'Maintenance Poster'}</span>
              </Link>

              {isLocalhost && (
                <div className="mx-3 mt-2 rounded-md bg-yellow-900/30 border border-yellow-700/50 p-2">
                  <p className="text-[10px] text-yellow-200">
                    {language === 'ar' 
                      ? '⚠️ الرابط محلي (localhost). اضبط عنوان الموقع العام في الإعدادات.'
                      : '⚠️ Local link (localhost). Set public URL in settings.'}
                  </p>
                </div>
              )}
            </div>
          </nav>

          {/* User Section */}
          <div className="border-t border-primary-foreground/10 p-4">
            <button 
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/90 transition-all hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <LogOut className="h-5 w-5" />
              <span>{t('sidebar.logout')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
