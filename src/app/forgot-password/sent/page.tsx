'use client'

import { Building2, Mail, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import Link from 'next/link'

export default function ForgotPasswordSentPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  
  const isRTL = language === 'ar'

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
              {t('auth.resetLinkSent')}
            </p>
          </div>

          <CardContent className="px-8 py-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-3">
                {t('auth.resetLinkSent')}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('auth.resetLinkSentMessage')}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">{t('auth.checkInbox')}</p>
                  <p className="text-xs text-blue-700">{t('auth.resetLinkExpiry')}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Back to Login */}
              <Link href="/login">
                <Button 
                  className="h-12 w-full gap-2 text-base font-semibold shadow-md hover:shadow-lg"
                  variant="default"
                >
                  {isRTL ? (
                    <>
                      <ArrowRight className="h-5 w-5" />
                      {t('auth.backToLogin')}
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="h-5 w-5" />
                      {t('auth.backToLogin')}
                    </>
                  )}
                </Button>
              </Link>

              {/* Resend Link */}
              <Link href="/forgot-password">
                <Button 
                  className="h-12 w-full text-base"
                  variant="outline"
                >
                  {t('auth.resendLink')}
                </Button>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                {language === 'ar' 
                  ? 'إذا لم تستلم البريد، تحقق من مجلد البريد غير المرغوب فيه' 
                  : "If you didn't receive the email, check your spam folder"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
