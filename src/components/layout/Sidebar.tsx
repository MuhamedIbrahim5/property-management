'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, DoorOpen, Wrench, Settings, LogOut, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: Home },
  { name: 'العقارات', href: '/dashboard/properties', icon: Building2 },
  { name: 'الوحدات', href: '/dashboard/units', icon: DoorOpen },
  { name: 'بلاغات الصيانة', href: '/dashboard/maintenance', icon: Wrench },
  { name: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

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
        "fixed right-0 top-0 z-50 h-screen w-64 border-l border-border/50 bg-primary text-primary-foreground shadow-lg transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo و زر الإغلاق */}
          <div className="flex h-16 items-center justify-between border-b border-primary-foreground/10 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-xl font-bold shadow-md">
                🏢
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white">إدارة الأملاك</span>
                <span className="text-xs text-primary-foreground/70">نظام الصيانة</span>
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
              القائمة الرئيسية
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
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-primary-foreground/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-primary-foreground/10 p-4">
            <button 
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground/80 transition-all hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
