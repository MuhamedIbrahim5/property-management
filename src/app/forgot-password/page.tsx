'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Mail, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  const isRTL = language === 'ar'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.status === 429) {
        setError(data.message || t('messages.tryAgain'))
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError(data.message || t('messages.operationFailed'))
        setLoading(false)
        return
      }

      // Success - redirect to confirmation page
      router.push('/forgot-password/sent')
    } catch (err) {
      setError(t('messages.operationFailed'))
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
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/40" />
      
      {/* Header */}
      <PublicPageHeader showMaintenanceButton={false} />

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
              {t('auth.resetPasswordTitle')}
            </p>
          </div>

          <CardContent className="px-8 py-8">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-slate-800">
                {t('auth.resetPasswordTitle')}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {t('auth.resetPasswordSubtitle')}
              </p>
            </div>

            {/* Form */}
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
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRTL ? 'right-3' : 'left-3'}`}>
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`h-11 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    placeholder={t('auth.emailPlaceholder')}
                    dir="ltr"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="h-12 w-full gap-2 text-base font-semibold shadow-md hover:shadow-lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('auth.sendingResetLink')}
                  </>
                ) : (
                  <>
                    {isRTL && <Mail className="h-5 w-5" />}
                    {t('auth.sendResetLink')}
                    {!isRTL && <Mail className="h-5 w-5" />}
                  </>
                )}
              </Button>

              {/* Back to Login Link */}
              <div className="text-center pt-4">
                <Link 
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 hover:underline"
                >
                  {isRTL ? (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      {t('auth.backToLogin')}
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="h-4 w-4" />
                      {t('auth.backToLogin')}
                    </>
                  )}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
