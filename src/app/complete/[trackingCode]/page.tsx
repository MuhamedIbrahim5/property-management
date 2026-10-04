'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Upload, Loader2, AlertTriangle } from 'lucide-react'

export default function CompleteMaintenancePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const trackingCode = params.trackingCode as string
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [request, setRequest] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [technicianName, setTechnicianName] = useState('')
  const [technicianPhone, setTechnicianPhone] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    fetchRequest()
  }, [trackingCode])

  const fetchRequest = async () => {
    // Check if completion token is provided
    if (!token) {
      setError('رابط إتمام البلاغ غير صحيح. يجب أن يحتوي على رمز التفويض.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/maintenance/tracking/${trackingCode}`)
      if (!res.ok) {
        setError('رمز المتابعة غير صحيح أو البلاغ غير موجود')
        setLoading(false)
        return
      }
      const data = await res.json()
      
      if (data.status.isCompleted) {
        setError('هذا البلاغ مكتمل بالفعل')
      }
      
      setRequest(data)
    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
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
      alert('يرجى إدخال اسم الفني ورقم الجوال')
      return
    }

    if (!token) {
      alert('رمز التفويض مفقود')
      return
    }

    setSubmitting(true)

    try {
      const requestData: any = {
        trackingCode,
        token,
        technicianName: technicianName.trim(),
        technicianPhone: technicianPhone.trim(),
      }

      // Add image if provided
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
        throw new Error(data.error || 'فشل إتمام البلاغ')
      }

      setSuccess(true)
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إتمام البلاغ')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-good">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-good/10">
                <CheckCircle2 className="h-8 w-8 text-good" />
              </div>
              <CardTitle className="text-2xl">تم إتمام البلاغ بنجاح!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">شكراً لإتمام بلاغ الصيانة</p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">رقم البلاغ</p>
                <p className="text-2xl font-bold text-primary">{request.requestNumber}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>إتمام بلاغ الصيانة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم البلاغ:</span>
                  <span className="font-semibold">{request.requestNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العقار:</span>
                  <span>{request.property.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الوحدة:</span>
                  <span>{request.unit.unitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المشكلة:</span>
                  <span>{request.issueDescription}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  اسم الفني <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="أدخل اسم الفني"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  رقم جوال الفني <span className="text-destructive">*</span>
                </label>
                <Input
                  type="tel"
                  value={technicianPhone}
                  onChange={(e) => setTechnicianPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  صورة إثبات التنفيذ (اختياري)
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-input p-6 transition-colors hover:border-primary">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        اضغط لاختيار صورة
                      </p>
                      <p className="text-xs text-muted-foreground">الحجم الأقصى: 5 ميجابايت</p>
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
                        alt="معاينة"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute left-2 top-2"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview('')
                        }}
                      >
                        إزالة
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإتمام...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                    تأكيد إتمام البلاغ
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
