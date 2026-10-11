'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, LogIn, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPasswordMessage, setShowForgotPasswordMessage] = useState(false)

  const isRTL = language === 'ar'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('auth.invalidCredentials'))
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError(t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

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
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-slate-900/40" />
      
      {/* Shared Public Page Header with Language Switcher & Maintenance Button */}
      <PublicPageHeader showMaintenanceButton={true} />

      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center relative z-10">
        <Card className="w-full overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-primary to-primary/90 px-8 py-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm shadow-lg">
              <Building2 className="h-10 w-10 text-amber-400" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-xl font-bold text-white mb-1">
              {language === 'ar' ? t('auth.companyName') : t('auth.companyNameEn')}
            </h1>
            <p className="text-sm text-slate-300 mb-4">
              {language === 'ar' ? t('auth.companyNameEn') : t('auth.companyName')}
            </p>
            
            <div className="mx-auto h-px w-16 bg-amber-400/50 mb-4"></div>
            
            <p className="text-sm font-medium text-slate-200">
              {language === 'ar' ? t('auth.propertyManagementSystem') : t('auth.propertyManagementSystemEn')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'ar' ? t('auth.propertyManagementSystemEn') : t('auth.propertyManagementSystem')}
            </p>
          </div>

          <CardContent className="px-8 py-8">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-slate-800">
                {language === 'ar' ? t('auth.adminLogin') : t('auth.adminLoginEn')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' ? t('auth.adminLoginEn') : t('auth.adminLogin')}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {language === 'ar' ? t('auth.email') : 'Email address'}
                </label>
                <div className="relative">
                  <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRTL ? 'right-3' : 'left-3'}`}>
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`h-11 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    placeholder={t('auth.emailPlaceholder')}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {language === 'ar' ? t('auth.password') : 'Password'}
                </label>
                <div className="relative">
                  <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRTL ? 'right-3' : 'left-3'}`}>
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    className={`h-11 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'}`}
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 flex items-center ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600`}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordMessage(true)}
                  className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>

              {/* Forgot Password Message */}
              {showForgotPasswordMessage && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <p>{t('auth.forgotPasswordNotAvailable')}</p>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordMessage(false)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {language === 'ar' ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              )}

              <Button 
                type="submit" 
                className="h-12 w-full gap-2 text-base font-semibold shadow-md hover:shadow-lg" 
                disabled={loading}
              >
                {language === 'ar' ? (
                  <>
                    <LogIn className="h-5 w-5" />
                    {loading ? t('auth.loggingIn') : t('auth.signIn')}
                  </>
                ) : (
                  <>
                    {loading ? t('auth.loggingIn') : t('auth.signInEn')}
                    <LogIn className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
