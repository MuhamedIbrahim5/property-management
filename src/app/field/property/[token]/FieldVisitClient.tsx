'use client'

import { useState, useRef } from 'react'
import { MapPin, Camera, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

type Property = {
  id: string
  name: string
  nameEn?: string | null
  neighborhood: string
  neighborhoodEn?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

type Request = {
  id: string
  requestNumber: string
  issueDescription: string
  priority: string
  createdAt: Date
  type: { name: string }
  status: { name: string }
  unit: { unitNumber: string }
}

interface FieldVisitClientProps {
  property: Property
  requests: Request[]
  token: string
  userId: string
  userName: string
  userRole: string
}

export default function FieldVisitClient({ property, requests, token, userId, userName, userRole }: FieldVisitClientProps) {
  const { language } = useLanguage()
  const isRTL = language === 'ar'
  
  const [selectedRequest, setSelectedRequest] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number
  } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [locationError, setLocationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      alert(isRTL ? 'الحد الأقصى 5 صور' : 'Maximum 5 images allowed')
      return
    }

    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== files.length) {
      alert(isRTL ? 'يُسمح فقط بملفات الصور' : 'Only image files are allowed')
    }

    setImages(prev => [...prev, ...imageFiles])

    // Create previews
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(isRTL ? 'الموقع الجغرافي غير مدعوم في متصفحك' : 'Geolocation is not supported by your browser')
      setLocationStatus('error')
      return
    }

    setLocationStatus('loading')
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
        setLocationStatus('success')
      },
      (error) => {
        let errorMessage = isRTL ? 'فشل الحصول على الموقع' : 'Failed to get location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = isRTL ? 'تم رفض إذن الموقع. الرجاء تفعيل الوصول للموقع.' : 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = isRTL ? 'معلومات الموقع غير متاحة. الرجاء التحقق من GPS.' : 'Location information unavailable. Please check GPS.'
            break
          case error.TIMEOUT:
            errorMessage = isRTL ? 'انتهت مهلة طلب الموقع. الرجاء المحاولة مرة أخرى.' : 'Location request timed out. Please try again.'
            break
        }
        setLocationError(errorMessage)
        setLocationStatus('error')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRequest) {
      alert(isRTL ? 'الرجاء اختيار بلاغ صيانة' : 'Please select a maintenance request')
      return
    }

    if (!notes.trim()) {
      alert(isRTL ? 'الرجاء إدخال ملاحظات الزيارة' : 'Please enter visit notes')
      return
    }

    if (!location) {
      const confirm = window.confirm(
        isRTL 
          ? 'لم يتم تحديد الموقع. سيتم حفظ الزيارة كغير موثقة. هل تريد المتابعة؟'
          : 'Location not detected. Visit will be saved as unverified. Continue?'
      )
      if (!confirm) return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('requestId', selectedRequest)
      formData.append('notes', notes)
      formData.append('token', token)
      
      if (location) {
        formData.append('latitude', location.latitude.toString())
        formData.append('longitude', location.longitude.toString())
        formData.append('accuracy', location.accuracy.toString())
      }

      images.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })

      const res = await fetch('/api/field-visits', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save visit')
      }

      setSuccess(true)
      // Reset form
      setSelectedRequest('')
      setNotes('')
      setImages([])
      setImagePreviews([])
      setLocation(null)
      setLocationStatus('idle')

      setTimeout(() => setSuccess(false), 5000)
    } catch (error: any) {
      console.error('Error saving visit:', error)
      alert(error.message || (isRTL ? 'فشل حفظ الزيارة' : 'Failed to save visit'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-primary mb-2">
              {isRTL ? 'تسجيل زيارة ميدانية' : 'Field Visit Registration'}
            </h1>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{language === 'ar' ? property.name : (property.nameEn || property.name)}</p>
              <p className="text-muted-foreground">{language === 'ar' ? property.neighborhood : (property.neighborhoodEn || property.neighborhood)}</p>
              {property.address && (
                <p className="text-muted-foreground">{property.address}</p>
              )}
            </div>
            {/* User Info Badge */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <strong>{isRTL ? 'المراقب:' : 'Inspector:'}</strong> {userName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? 'الزيارة ستُسجل باسمك' : 'Visit will be recorded under your name'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {success && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-medium">
                {isRTL ? 'تم حفظ الزيارة بنجاح!' : 'Visit saved successfully!'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Request */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'اختر بلاغ الصيانة' : 'Select Maintenance Request'} <span className="text-red-500">*</span>
                </label>
                {requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-gray-100 rounded">
                    {isRTL ? 'لا توجد بلاغات صيانة مفتوحة لهذا العقار' : 'No open maintenance requests for this property'}
                  </p>
                ) : (
                  <select
                    value={selectedRequest}
                    onChange={(e) => setSelectedRequest(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">{isRTL ? '-- اختر بلاغ --' : '-- Select Request --'}</option>
                    {requests.map(req => (
                      <option key={req.id} value={req.id}>
                        {req.requestNumber} - {req.type.name} - {isRTL ? 'وحدة' : 'Unit'} {req.unit.unitNumber}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'ملاحظات الزيارة' : 'Visit Notes'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  placeholder={isRTL ? 'صف ما تم ملاحظته أو إنجازه خلال الزيارة...' : 'Describe what was observed or done during the visit...'}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{isRTL ? 'الموقع' : 'Location'}</h3>
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationStatus === 'loading'}
                  size="sm"
                  variant="outline"
                >
                  {locationStatus === 'loading' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {isRTL ? 'جاري التحديد...' : 'Getting...'}</>
                  ) : (
                    <><MapPin className="h-4 w-4 mr-2" /> {isRTL ? 'تحديد الموقع الحالي' : 'Get Current Location'}</>
                  )}
                </Button>
              </div>

              {locationStatus === 'success' && location && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 inline mr-2" />
                  {isRTL 
                    ? `تم تحديد الموقع (الدقة: ±${Math.round(location.accuracy)}م)`
                    : `Location detected (Accuracy: ±${Math.round(location.accuracy)}m)`
                  }
                </div>
              )}

              {locationStatus === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <AlertCircle className="h-4 w-4 text-red-600 inline mr-2" />
                  {locationError}
                </div>
              )}

              {locationStatus === 'idle' && (
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'انقر على الزر أعلاه لتحديد موقعك الحالي' : 'Click the button above to detect your current location'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{isRTL ? `الصور (${images.length}/5)` : `Photos (${images.length}/5)`}</h3>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 5}
                  size="sm"
                  variant="outline"
                >
                  <Camera className="h-4 w-4 mr-2" /> {isRTL ? 'إضافة صورة' : 'Add Photo'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting || requests.length === 0}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {isRTL ? 'جاري الحفظ...' : 'Saving...'}</>
            ) : (
              <><Send className="h-5 w-5 mr-2" /> {isRTL ? 'حفظ الزيارة' : 'Save Visit'}</>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
