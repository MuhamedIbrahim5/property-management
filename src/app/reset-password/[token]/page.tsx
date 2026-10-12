'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Building2, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  
  const { t } = useTranslation()
  const { language } = useLanguage()
  
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState<'invalid' | 'expired' | 'used' | null>(null)
  const [email, setEmail] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isRTL = language === 'ar'

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password/verify?token=${token}`)
        const data = await response.json()

        if (data.valid) {
          setTokenValid(true)
          setEmail(data.email)
        } else {
          setTokenValid(false)
          setTokenError(data.error || 'invalid')
        }
      } catch (err) {
        setTokenValid(false)
        setTokenError('invalid')
      } finally {
        setVerifying(false)
      }
    }

    if (token) {
      verifyToken()
    }
  }, [token])

  const getPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 8) return 'weak'
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return 'strong'
    }
    if (pwd.length >= 8 && (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd))) {
      return 'medium'
    }
    return 'weak'
  }

  const passwordStrength = password ? getPasswordStrength(password) : null
  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }
  const strengthTexts = {
    weak: t('auth.weak'),
    medium: t('auth.medium'),
    strong: t('auth.strong'),
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'))
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'used') {
          setTokenError('used')
          setTokenValid(false)
        } else if (data.error === 'expired') {
          setTokenError('expired')
          setTokenValid(false)
        } else {
          setError(data.message || t('messages.operationFailed'))
        }
        setLoading(false)
        return
      }

      // Success - redirect to success page
      router.push('/reset-password/success')
    } catch (err) {
      setError(t('messages.operationFailed'))
      setLoading(false)
    }
  }

  // Loading state
  if (verifying) {
    return (
      <div 
        className={`relative min-h-screen px-4 py-8 flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          backgroundImage: 'url(/images/Image_login.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/40" />
        <PublicPageHeader showMaintenanceButton={false} />
        <div className="relative z-10 text-white text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</p>
        </div>
      </div>
    )
  }

  // Invalid token states
  if (!tokenValid) {
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
        <div className="absolute inset-0 bg-slate-900/40" />
        <PublicPageHeader showMaintenanceButton={false} />

        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center relative z-10">
          <Card className="w-full overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <div className="bg-gradient-to-br from-destructive to-destructive/90 px-8 py-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm shadow-lg">
                <XCircle className="h-10 w-10 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-bold text-white">
                {tokenError === 'expired' && t('auth.expiredToken')}
                {tokenError === 'used' && t('auth.usedToken')}
                {tokenError === 'invalid' && t('auth.invalidToken')}
              </h1>
            </div>

            <CardContent className="px-8 py-8 text-center">
              <p className="text-slate-600 mb-6">
                {tokenError === 'expired' && t('auth.expiredTokenMessage')}
                {tokenError === 'used' && t('auth.usedTokenMessage')}
                {tokenError === 'invalid' && t('auth.invalidTokenMessage')}
              </p>

              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="h-12 w-full text-base" variant="default">
                    {t('auth.requestNewLink')}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="h-12 w-full text-base" variant="outline">
                    {t('auth.backToLogin')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Valid token - show password reset form
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
      <div className="absolute inset-0 bg-slate-900/40" />
      <PublicPageHeader showMaintenanceButton={false} />

      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center relative z-10">
        <Card className="w-full overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          {/* Header */}
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
              {t('auth.setNewPassword')}
            </p>
          </div>

          <CardContent className="px-8 py-8">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-slate-800">
                {t('auth.setNewPassword')}
              </h2>
              <p className="text-xs text-slate-500 mt-1" dir="ltr">{email}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRTL ? 'right-3' : 'left-3'}`}>
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className={`h-11 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'}`}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 flex items-center ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600`}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Strength */}
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">{t('auth.passwordStrength')}</span>
                      <span className="text-xs font-medium text-slate-700">{strengthTexts[passwordStrength]}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${strengthColors[passwordStrength]}`}
                        style={{ width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{t('auth.passwordRequirements')}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <div className={`pointer-events-none absolute inset-y-0 flex items-center ${isRTL ? 'right-3' : 'left-3'}`}>
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className={`h-11 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'}`}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute inset-y-0 flex items-center ${isRTL ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600`}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Match Indicator */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600">
                          {language === 'ar' ? 'كلمات المرور متطابقة' : 'Passwords match'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-red-600">{t('auth.passwordsDoNotMatch')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="h-12 w-full gap-2 text-base font-semibold shadow-md hover:shadow-lg" 
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('auth.updatingPassword')}
                  </>
                ) : (
                  <>
                    {isRTL && <CheckCircle className="h-5 w-5" />}
                    {t('auth.updatePassword')}
                    {!isRTL && <CheckCircle className="h-5 w-5" />}
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
