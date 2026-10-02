'use client'

import { useState, useEffect } from 'react'
import { Building2, Home, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Property = {
  id: string
  name: string
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
  const [submitted, setSubmitted] = useState(false)
  const [requestNumber, setRequestNumber] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [types, setTypes] = useState<MaintenanceType[]>([])
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check for unitId in URL
        const urlParams = new URLSearchParams(window.location.search)
        const unitIdFromUrl = urlParams.get('unitId')

        // Fetch properties
        const propertiesRes = await fetch('/api/properties')
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData)

        // Fetch units
        const unitsRes = await fetch('/api/units')
        const unitsData = await unitsRes.json()
        setUnits(unitsData)

        // Fetch types
        const typesRes = await fetch('/api/maintenance/types')
        const typesData = await typesRes.json()
        setTypes(typesData)

        // Pre-select unit if found in URL
        if (unitIdFromUrl) {
          const unit = unitsData.find((u: Unit) => u.id === unitIdFromUrl)
          if (unit) {
            setSelectedUnit(unit.id)
            setSelectedProperty(unit.propertyId)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredUnits = selectedProperty
    ? units.filter((unit) => unit.propertyId === selectedProperty)
    : units

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      propertyId: formData.get('propertyId'),
      unitId: formData.get('unitId'),
      issueDescription: formData.get('issueDescription'),
      typeId: formData.get('typeId'),
      priority: formData.get('priority'),
      requesterName: formData.get('requesterName'),
      requesterPhone: formData.get('requesterPhone'),
      isPublicRequest: true,
    }

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
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('حدث خطأ أثناء إرسال الطلب')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-good">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-good/10">
                <CheckCircle2 className="h-8 w-8 text-good" />
              </div>
              <CardTitle className="text-2xl">تم إرسال الطلب بنجاح!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">رقم البلاغ</p>
                <p className="text-3xl font-bold text-primary">{requestNumber}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">رمز المتابعة</p>
                <p className="text-2xl font-bold text-foreground">{trackingCode}</p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  احتفظ برقم البلاغ ورمز المتابعة لمتابعة حالة الطلب
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    const message = `🔧 طلب صيانة جديد\n\n📋 رقم البلاغ: ${requestNumber}\n🔑 رمز المتابعة: ${trackingCode}\n\nتم إرسال الطلب بنجاح وسيتم التواصل معك قريباً.`
                    const whatsappUrl = `https://wa.me/966506539610?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  إرسال عبر واتساب
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSubmitted(false)
                    setRequestNumber('')
                    setTrackingCode('')
                  }}
                >
                  إرسال طلب جديد
                </Button>
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
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">طلب صيانة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            املأ النموذج أدناه وسنتواصل معك في أقرب وقت
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>بيانات الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Requester Info */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    الاسم <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="requesterName"
                    required
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    رقم الجوال <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    name="requesterPhone"
                    required
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>

              {/* Property & Unit */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    العقار <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="propertyId"
                    required
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر العقار</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    الوحدة <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="unitId"
                    required
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={!selectedProperty}
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">اختر الوحدة</option>
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
                    نوع المشكلة <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="typeId"
                    required
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر نوع المشكلة</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    الأولوية <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="priority"
                    required
                    defaultValue="normal"
                    className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="normal">عادي</option>
                    <option value="urgent">عاجل</option>
                    <option value="low">منخفض</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">
                    وصف المشكلة <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    name="issueDescription"
                    required
                    rows={4}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="اشرح المشكلة بالتفصيل..."
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="flex gap-3 rounded-lg bg-blue-50 p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-blue-900">
                  سيتم إرسال رقم البلاغ ورمز المتابعة بعد إرسال الطلب. احتفظ بهما لمتابعة
                  حالة طلبك.
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg">
                إرسال الطلب
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
