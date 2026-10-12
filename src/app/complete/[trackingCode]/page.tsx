'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Upload, Loader2, AlertTriangle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTranslation } from '@/hooks/useTranslation'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'

export default function CompleteMaintenancePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation()
  const trackingCode = params.trackingCode as string
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [request, setRequest] = useState<any>(null)
  const [statuses, setStatuses] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [technicianName, setTechnicianName] = useState('')
  const [technicianPhone, setTechnicianPhone] = useState('')
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    // Don't fetch if already successfully completed in this session
    if (success) {
      return
    }

    const fetchRequest = async () => {
      if (!token) {
        setError(t('completion.invalidLink'))
        setLoading(false)
        return
      }

      try {
        // Fetch request details
        const res = await fetch(`/api/maintenance/tracking/${trackingCode}`)
        if (!res.ok) {
          setError(t('completion.invalidTracking'))
          setLoading(false)
          return
        }
        const data = await res.json()
        
        // Match API logic: check if completedAt exists OR status is completed
        if (data.completedAt || data.status.isCompleted) {
          setError(t('completion.alreadyCompleted'))
        }
        
        setRequest(data)

        // Fetch available statuses
        const statusRes = await fetch('/api/maintenance/statuses')
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setStatuses(statusData.filter((s: any) => s.isActive))
          
          // Set default to completed status
          const completedStatus = statusData.find((s: any) => s.isCompleted)
          if (completedStatus) {
            setSelectedStatusId(completedStatus.id)
          }
        }
      } catch (err) {
        setError(t('completion.loadError'))
      } finally {
        setLoading(false)
      }
    }

    fetchRequest()
  }, [trackingCode, token, t, success])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('completion.imageTooLarge'))
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!technicianName.trim() || !technicianPhone.trim()) {
      alert(t('completion.requiredInfo'))
      return
    }

    if (!token) {
      alert(t('completion.tokenMissing'))
      return
    }

    setSubmitting(true)

    try {
      const requestData: any = {
        trackingCode,
        token,
        technicianName: technicianName.trim(),
        technicianPhone: technicianPhone.trim(),
        statusId: selectedStatusId || undefined,
      }

      if (imageFile && imagePreview) {
        requestData.completionImage = imagePreview
      }

      const res = await fetch('/api/maintenance/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t('completion.completionError'))
      }

      setSuccess(true)
    } catch (err: any) {
      alert(err.message || t('completion.completionError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-background px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className={`min-h-screen bg-background px-4 py-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Shared Public Page Header with Language Switcher */}
        <PublicPageHeader />
        
        <div className="mx-auto max-w-2xl mt-16">
          <Card className="border-good">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-good/10">
                <CheckCircle2 className="h-8 w-8 text-good" />
              </div>
              <CardTitle className="text-2xl">{t('completion.successTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">{t('completion.thankYou')}</p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('completion.requestNumber')}</p>
                <p className="text-2xl font-bold text-primary">{request.requestNumber}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background px-4 py-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Shared Public Page Header with Language Switcher */}
      <PublicPageHeader />
      
      <div className="mx-auto max-w-2xl mt-16">

        <Card>
          <CardHeader>
            <CardTitle>{t('completion.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('completion.requestNumber')}:</span>
                  <span className="font-semibold">{request.requestNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('completion.property')}:</span>
                  <span>{request.property.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('completion.unit')}:</span>
                  <span>{request.unit.unitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('completion.issue')}:</span>
                  <span>{request.issueDescription}</span>
                </div>
                {request.requesterPhone && (
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground">{isRTL ? 'جوال العميل' : 'Customer Phone'}:</span>
                    <span className="font-semibold" dir="ltr">{request.requesterPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('completion.technicianName')} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder={t('request.fullNamePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('completion.technicianPhone')} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="tel"
                  value={technicianPhone}
                  onChange={(e) => setTechnicianPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  required
                  dir="ltr"
                />
              </div>

              {/* Status Selection */}
              {statuses.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {isRTL ? 'حالة البلاغ' : 'Request Status'} <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={selectedStatusId}
                    onChange={(e) => setSelectedStatusId(e.target.value)}
                    required
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.icon && `${status.icon} `}{status.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isRTL 
                      ? 'اختر الحالة المناسبة للبلاغ' 
                      : 'Select the appropriate status for this request'}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('completion.completionImage')} {t('completion.imageOptional')}
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-input p-6 transition-colors hover:border-primary">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t('completion.uploadImage')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('completion.maxFileSize')}</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'}`}
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview('')
                        }}
                      >
                        {t('completion.removeImage')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'mr-2' : 'ml-2'}`} />
                    {t('completion.completing')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                    {t('completion.confirmCompletion')}
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
