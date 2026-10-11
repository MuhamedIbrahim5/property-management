'use client'

import { useState, useEffect } from 'react'
import { Building2, Home, MessageSquare, AlertCircle, CheckCircle2, Upload, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { buildAppUrl } from '@/lib/url'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'

type Property = {
  id: string
  name: string
  neighborhood: string
}

type Unit = {
  id: string
  unitNumber: string
  propertyId: string
}

type MaintenanceType = {
  id: string
  name: string
}

export default function PublicRequestPage() {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestNumber, setRequestNumber] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [completionUrl, setCompletionUrl] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [types, setTypes] = useState<MaintenanceType[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [loading, setLoading] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageError, setImageError] = useState('')
  
  const isRTL = language === 'ar'

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check for unitId in URL
        const urlParams = new URLSearchParams(window.location.search)
        const unitIdFromUrl = urlParams.get('unitId')

        // Fetch properties from public API
        const propertiesRes = await fetch('/api/public/properties')
        const propertiesData = await propertiesRes.json()
        
        // Validate properties is an array
        if (Array.isArray(propertiesData)) {
          setProperties(propertiesData)
        } else {
          console.error('Properties data is not an array:', propertiesData)
          setProperties([])
        }

        // Fetch units from public API
        const unitsRes = await fetch('/api/public/units')
        const unitsData = await unitsRes.json()
        
        // Validate units is an array
        if (Array.isArray(unitsData)) {
          setUnits(unitsData)
        } else {
          console.error('Units data is not an array:', unitsData)
          setUnits([])
        }

        // Fetch types from public API
        const typesRes = await fetch('/api/public/maintenance-types')
        const typesData = await typesRes.json()
        
        // Validate types is an array
        if (Array.isArray(typesData)) {
          setTypes(typesData)
        } else {
          console.error('Types data is not an array:', typesData)
          setTypes([])
        }

        // Pre-select unit if found in URL
        if (unitIdFromUrl && Array.isArray(unitsData)) {
          const unit = unitsData.find((u: Unit) => u.id === unitIdFromUrl)
          if (unit) {
            setSelectedUnit(unit.id)
            setSelectedProperty(unit.propertyId)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Set empty arrays on error to prevent crashes
        setProperties([])
        setUnits([])
        setTypes([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredUnits = selectedProperty
    ? units.filter((unit) => unit.propertyId === selectedProperty)
    : units

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError('')
    
    if (file) {
      // Client-side validation
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setImageError(t('request.invalidFileType'))
        return
      }

      const maxSize = 3 * 1024 * 1024 // 3 MB
      if (file.size > maxSize) {
        setImageError(t('request.fileTooLarge'))
        return
      }

      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setImageError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    
    const formData = new FormData(e.currentTarget)

    // Helper function to get non-empty string or null
    const getFormValue = (name: string): string | null => {
      const value = formData.get(name)
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return null
      }
      return value as string
    }

    // Convert hour and period to HH:MM format
    const convertTo24Hour = (hour: string, period: string): string => {
      let h = parseInt(hour)
      if (period === 'PM' && h !== 12) {
        h += 12
      } else if (period === 'AM' && h === 12) {
        h = 0
      }
      return `${h.toString().padStart(2, '0')}:00`
    }

    const requestedHour = getFormValue('requestedHour')
    const requestedPeriod = getFormValue('requestedPeriod')
    const requestedTime = requestedHour && requestedPeriod 
      ? convertTo24Hour(requestedHour, requestedPeriod)
      : null

    const data: any = {
      propertyId: getFormValue('propertyId'),
      unitId: getFormValue('unitId'),
      issueDescription: getFormValue('issueDescription'),
      typeId: getFormValue('typeId'),
      priority: getFormValue('priority') || 'normal',
      requesterName: getFormValue('requesterName'),
      requesterPhone: getFormValue('requesterPhone'),
      isPublicRequest: true,
      requestedDate: getFormValue('requestedDate'),
      requestedTime: requestedTime,
    }

    // Add image if provided
    if (imagePreview) {
      data.attachmentImage = imagePreview
    }

    // Log data for debugging (without sensitive info)
    console.log('Submitting request with data:', {
      ...data,
      requesterPhone: '***',
      attachmentImage: data.attachmentImage ? '[IMAGE DATA]' : null
    })

    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setRequestNumber(result.requestNumber)
        setTrackingCode(result.trackingCode)
        setCompletionUrl(result.completionUrl || buildAppUrl(`/complete/${result.trackingCode}`))
        setSubmitted(true)
      } else {
        const error = await response.json()
        console.error('Server error response:', error)
        alert(error.error || t('request.submissionError'))
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert(t('request.submissionError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" text={t('request.loading')} />
      </div>
    )
  }

  if (submitted) {
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
              <CardTitle className="text-2xl">{t('request.successTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('request.requestNumber')}</p>
                <p className="text-3xl font-bold text-primary">{requestNumber}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('request.trackingCode')}</p>
                <p className="text-2xl font-bold text-foreground">{trackingCode}</p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  {t('request.keepReference')}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full gap-2"
                  onClick={async () => {
                    try {
                      const settingsRes = await fetch('/api/public/settings')
                      if (!settingsRes.ok) {
                        throw new Error('Failed to fetch settings')
                      }
                      const settingsData = await settingsRes.json()
                      
                      // Validate that settingsData is an array
                      if (!Array.isArray(settingsData)) {
                        console.error('Settings data is not an array:', settingsData)
                        alert(language === 'ar' 
                          ? 'عذراً، حدث خطأ في تحميل إعدادات واتساب'
                          : 'Sorry, failed to load WhatsApp settings')
                        return
                      }
                      
                      const settings = Object.fromEntries(settingsData.map((s: any) => [s.key, s.value]))
                      const whatsappNumber = settings.whatsapp_number
                      const whatsappEnabled = settings.whatsapp_enabled === 'true'
                      
                      if (!whatsappNumber || !whatsappEnabled) {
                        alert(language === 'ar' 
                          ? 'عذراً، خدمة واتساب غير متاحة حالياً'
                          : 'Sorry, WhatsApp service is not available')
                        return
                      }
                      
                      const message = language === 'ar'
                        ? `🔧 *طلب صيانة جديد*\n\n📋 *رقم البلاغ:* ${requestNumber}\n🔑 *رمز المتابعة:* ${trackingCode}\n\n🔗 *رابط إتمام البلاغ للفني:*\n${completionUrl}\n\n✅ تم إرسال الطلب بنجاح وسيتم التواصل معك قريباً.\n\n_للمتابعة أو الاستفسار، يمكنك الرد على هذه الرسالة_`
                        : `🔧 *New Maintenance Request*\n\n📋 *Request Number:* ${requestNumber}\n🔑 *Tracking Code:* ${trackingCode}\n\n🔗 *Technician Completion Link:*\n${completionUrl}\n\n✅ Request submitted successfully. We will contact you soon.\n\n_For follow-up or inquiries, you can reply to this message_`
                      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
                      window.open(whatsappUrl, '_blank')
                    } catch (error) {
                      console.error('Error sending WhatsApp message:', error)
                      alert(language === 'ar' 
                        ? 'عذراً، حدث خطأ أثناء فتح واتساب'
                        : 'Sorry, failed to open WhatsApp')
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('request.sendViaWhatsApp')}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSubmitted(false)
                    setRequestNumber('')
                    setTrackingCode('')
                    setCompletionUrl('')
                    removeImage()
                  }}
                >
                  {t('request.newRequest')}
                </Button>
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

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('request.pageTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('request.pageDescription')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('request.formTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Requester Info */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.fullName')} <span className="text-destructive">{t('request.required')}</span>
                  </label>
                  <input
                    type="text"
                    name="requesterName"
                    required
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={t('request.fullNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.mobileNumber')} <span className="text-destructive">{t('request.required')}</span>
                  </label>
                  <input
                    type="tel"
                    name="requesterPhone"
                    required
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={t('request.mobileNumberPlaceholder')}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Property & Unit */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.property')} <span className="text-destructive">{t('request.required')}</span>
                  </label>
                  <select
                    name="propertyId"
                    required
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{t('request.propertyPlaceholder')}</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Neighborhood - Auto-filled from selected property */}
                {selectedProperty && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      {isRTL ? 'الحي' : 'Neighborhood'}
                    </label>
                    <div className="h-10 w-full rounded-lg border border-input bg-slate-50 px-3 text-sm flex items-center text-slate-700">
                      {properties.find(p => p.id === selectedProperty)?.neighborhood || '-'}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.unit')} <span className="text-destructive">{t('request.required')}</span>
                  </label>
                  <select
                    name="unitId"
                    required
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={!selectedProperty}
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">{t('request.unitPlaceholder')}</option>
                    {filteredUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Issue Details */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.maintenanceType')} <span className="text-destructive">{t('request.required')}</span>
                  </label>
                  <select
                    name="typeId"
                    required
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{t('request.maintenanceTypePlaceholder')}</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.priority')} <span className="text-destructive">{t('request.required')}</span>
                  </label>
                  <select
                    name="priority"
                    required
                    defaultValue="normal"
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="normal">{t('request.priorityNormal')}</option>
                    <option value="urgent">{t('request.priorityUrgent')}</option>
                    <option value="low">{t('request.priorityLow')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.issueDescription')} <span className="text-destructive">{t('request.required')}</span>
                  </label>
                  <textarea
                    name="issueDescription"
                    required
                    rows={4}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={t('request.issueDescriptionPlaceholder')}
                  />
                </div>
              </div>

              {/* Appointment Date & Time */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.requestedDate')}
                  </label>
                  <input
                    type="date"
                    name="requestedDate"
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    {t('request.requestedTime')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Hour Selection */}
                    <select
                      name="requestedHour"
                      className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      defaultValue="7"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                        <option key={hour} value={hour}>
                          {hour} {isRTL ? (hour === 12 ? 'ظهراً' : '') : (hour === 12 ? 'Noon' : '')}
                        </option>
                      ))}
                    </select>

                    {/* AM/PM Selection */}
                    <select
                      name="requestedPeriod"
                      className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      defaultValue="AM"
                    >
                      <option value="AM">{isRTL ? 'صباحاً' : 'AM'}</option>
                      <option value="PM">{isRTL ? 'مساءً' : 'PM'}</option>
                    </select>
                  </div>
                  
                  {/* Hidden field to store the actual time in HH:MM format */}
                  <input type="hidden" name="requestedTime" />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('request.attachPhoto')}
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('request.attachPhotoDescription')}
                </p>
                
                {!imagePreview ? (
                  <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-input p-6 transition-colors hover:border-primary">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t('request.chooseFile')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPEG, PNG, WebP (Max 3MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                ) : (
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
                      className={`absolute top-2 gap-2 ${isRTL ? 'right-2' : 'left-2'}`}
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                      {t('request.removeImage')}
                    </Button>
                  </div>
                )}
                
                {imageError && (
                  <p className="text-sm text-destructive">{imageError}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="flex gap-3 rounded-lg bg-blue-50 p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-blue-900">
                  {t('request.infoMessage')}
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? t('request.submitting') : t('request.submitRequest')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
