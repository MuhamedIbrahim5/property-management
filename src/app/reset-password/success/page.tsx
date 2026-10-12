'use client'

import { Building2, CheckCircle, LogIn } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import Link from 'next/link'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export default function ResetPasswordSuccessPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  
  const isRTL = language === 'ar'

  // Celebration effect
  useEffect(() => {
    const duration = 2000
    const animationEnd = Date.now() + duration
    const colors = ['#2C5D7A', '#3E7859', '#fbbf24']

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 2

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        },
        colors: colors,
        ticks: 60,
        gravity: 0.8,
        scalar: 0.8,
      })
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className={`relative min-h-screen px-4 py-8 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        backgroundImage: 'url(/images/Image_login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/40" />
      
      {/* Header */}
      <PublicPageHeader showMaintenanceButton={false} />

      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center relative z-10">
        <Card className="w-full overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 px-8 py-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-xl font-bold text-white mb-1">
              {t('auth.passwordResetSuccess')}
            </h1>
            <p className="text-sm text-white/90">
              {language === 'ar' ? t('auth.companyName') : t('auth.companyNameEn')}
            </p>
          </div>

          <CardContent className="px-8 py-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 animate-pulse">
                <CheckCircle className="h-12 w-12 text-green-600" strokeWidth={2} />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-3">
                {t('auth.passwordResetSuccess')}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('auth.passwordResetSuccessMessage')}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-800 text-center">
                <p className="font-medium">
                  {language === 'ar' 
                    ? 'تم تحديث كلمة المرور بنجاح!' 
                    : 'Password updated successfully!'}
                </p>
                <p className="text-xs mt-2 text-green-700">
                  {language === 'ar' 
                    ? 'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة' 
                    : 'You can now log in with your new password'}
                </p>
              </div>
            </div>

            {/* Login Button */}
            <Link href="/login">
              <Button 
                className="h-12 w-full gap-2 text-base font-semibold shadow-md hover:shadow-lg"
                variant="default"
              >
                {isRTL ? (
                  <>
                    <LogIn className="h-5 w-5" />
                    {t('auth.signIn')}
                  </>
                ) : (
                  <>
                    {t('auth.signInEn')}
                    <LogIn className="h-5 w-5" />
                  </>
                )}
              </Button>
            </Link>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                {language === 'ar' 
                  ? 'احتفظ بكلمة المرور في مكان آمن' 
                  : 'Keep your password in a safe place'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
