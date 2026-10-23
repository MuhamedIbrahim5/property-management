'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTranslation } from '@/hooks/useTranslation'
import { translateStatus, translateMaintenanceType } from '@/lib/data-translation'
import PropertyLocation from '@/components/PropertyLocation'
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  User,
  FileText,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface TrackingData {
  requestNumber: string
  trackingCode: string
  issueDescription: string
  priority: string
  createdAt: string
  requestedDate: string | null
  requestedTime: string | null
  requesterName: string
  requesterPhone: string
  property: {
    name: string
    neighborhood: string
    latitude: number | null
    longitude: number | null
  }
  unit: {
    unitNumber: string
  }
  type: {
    name: string
  }
  status: {
    name: string
    color: string
    isCompleted: boolean
  }
  assignee: {
    name: string
  } | null
}

interface TrackingClientProps {
  trackingCode: string
}

export default function TrackingClient({ trackingCode }: TrackingClientProps) {
  const { t } = useTranslation()
  const { language, isRTL } = useLanguage()
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTracking() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/maintenance/tracking/${trackingCode}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(isRTL ? 'البلاغ غير موجود' : 'Request not found')
          } else {
            setError(isRTL ? 'حدث خطأ في تحميل البيانات' : 'Error loading data')
          }
          setLoading(false)
          return
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching tracking data:', err)
        setError(isRTL ? 'حدث خطأ في الاتصال' : 'Connection error')
      } finally {
        setLoading(false)
      }
    }

    if (trackingCode) {
      fetchTracking()
    }
  }, [trackingCode, isRTL])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {error || (isRTL ? 'البلاغ غير موجود' : 'Request not found')}
          </h1>
          <p className="text-slate-600 mb-6">
            {isRTL
              ? 'الرجاء التحقق من رمز المتابعة والمحاولة مرة أخرى'
              : 'Please check the tracking code and try again'}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
          </a>
        </div>
      </div>
    )
  }

  const statusColor = data.status.color || '#2C5D7A'
  const isCompleted = data.status.isCompleted
  const isUrgent = data.priority === 'urgent'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div 
            className="p-6 text-white"
            style={{ backgroundColor: statusColor }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">
                    {isRTL ? 'تتبع البلاغ' : 'Track Request'}
                  </h1>
                  <p className="text-white/90 text-sm">
                    {translateStatus(data.status.name, language)}
                  </p>
                </div>
              </div>
              {isUrgent && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse">
                  {isRTL ? '🚨 عاجل' : '🚨 URGENT'}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm mb-1">
                  {isRTL ? 'رقم البلاغ' : 'Request Number'}
                </p>
                <p className="text-xl font-bold font-mono">{data.requestNumber}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm mb-1">
                  {isRTL ? 'رمز المتابعة' : 'Tracking Code'}
                </p>
                <p className="text-xl font-bold font-mono">{data.trackingCode}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {isRTL ? 'تفاصيل البلاغ' : 'Request Details'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {isRTL ? 'نوع البلاغ' : 'Request Type'}
                  </label>
                  <p className="text-slate-900 font-medium">
                    {translateMaintenanceType(data.type.name, language)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {isRTL ? 'وصف المشكلة' : 'Issue Description'}
                  </label>
                  <p className="text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                    {data.issueDescription}
                  </p>
                </div>

                {data.requestedDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>
                      {isRTL ? 'الموعد المطلوب:' : 'Requested Date:'}{' '}
                      <span className="font-medium text-slate-900">
                        {format(new Date(data.requestedDate), 'PP', {
                          locale: isRTL ? ar : undefined,
                        })}
                        {data.requestedTime && ` - ${data.requestedTime}`}
                      </span>
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {isRTL ? 'تاريخ الإنشاء' : 'Created At'}
                  </label>
                  <p className="text-slate-900">
                    {format(new Date(data.createdAt), 'PPp', {
                      locale: isRTL ? ar : undefined,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Property Location */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {isRTL ? 'العقار والوحدة' : 'Property & Unit'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-2">
                    {isRTL ? 'العقار' : 'Property'}
                  </label>
                  <div className="text-slate-900 font-medium">
                    {data.property.name}
                  </div>
                  <div className="text-sm text-slate-600">
                    {data.property.neighborhood}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {isRTL ? 'الوحدة' : 'Unit'}
                  </label>
                  <p className="text-slate-900 font-medium">{data.unit.unitNumber}</p>
                </div>

                {/* Property Location Map */}
                <div className="pt-4 border-t border-slate-200">
                  <label className="text-sm font-medium text-slate-600 block mb-3">
                    {isRTL ? 'موقع العقار' : 'Property Location'}
                  </label>
                  <PropertyLocation
                    latitude={data.property.latitude}
                    longitude={data.property.longitude}
                    propertyName={data.property.name}
                    neighborhood={data.property.neighborhood}
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requester Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {isRTL ? 'معلومات مقدم الطلب' : 'Requester Info'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">
                    {isRTL ? 'الاسم' : 'Name'}
                  </label>
                  <p className="text-slate-900">{data.requesterName}</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">
                    {isRTL ? 'رقم الجوال' : 'Phone'}
                  </label>
                  <a 
                    href={`tel:${data.requesterPhone}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="font-medium" dir="ltr">{data.requesterPhone}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Assigned To */}
            {data.assignee && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  {isRTL ? 'المسؤول' : 'Assigned To'}
                </h3>
                <p className="text-slate-900 font-medium">{data.assignee.name}</p>
              </div>
            )}

            {/* Status Info */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${statusColor}20` }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8" style={{ color: statusColor }} />
                  ) : (
                    <Clock className="w-8 h-8" style={{ color: statusColor }} />
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  {isRTL ? 'الحالة الحالية' : 'Current Status'}
                </p>
                <p className="text-lg font-bold" style={{ color: statusColor }}>
                  {translateStatus(data.status.name, language)}
                </p>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {isRTL ? 'ملاحظة' : 'Note'}
              </h3>
              <p className="text-sm text-blue-800">
                {isRTL
                  ? 'سيتم التواصل معك من قبل فريق الصيانة لتحديد موعد الزيارة وإتمام العمل.'
                  : 'Our maintenance team will contact you to schedule a visit and complete the work.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
