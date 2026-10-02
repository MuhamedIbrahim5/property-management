'use client'

import { useState } from 'react'
import { User, LogOut, Settings, Menu } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
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
          <h1 className="text-base sm:text-lg font-bold text-foreground">مرحباً بك</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">إدارة الأملاك والصيانة</p>
        </div>
      </div>
      
      <div className="relative flex items-center gap-3">
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
            <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-white shadow-lg">
              <div className="border-b border-border p-4">
                <p className="font-semibold text-foreground">{session?.user?.name || 'المستخدم'}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email || ''}</p>
                <p className="mt-1 text-xs text-muted-foreground">الدور: {session?.user?.role || 'viewer'}</p>
              </div>
              
              <div className="p-2">
                <a
                  href="/dashboard/account"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>حسابي</span>
                </a>
                
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
