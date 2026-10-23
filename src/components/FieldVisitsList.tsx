'use client'

import { MapPin, Clock, User, ExternalLink, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface FieldVisit {
  id: string
  visitDate: Date
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  locationError: string | null
  notes: string | null
  user: {
    name: string
  }
}

interface FieldVisitsListProps {
  visits: FieldVisit[]
  propertyLatitude?: number | null
  propertyLongitude?: number | null
}

export default function FieldVisitsList({ 
  visits, 
  propertyLatitude,
  propertyLongitude 
}: FieldVisitsListProps) {
  const { isRTL } = useLanguage()

  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  const openLocation = (lat: number, lng: number, visitDate: Date) => {
    const isApple = /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent)
    const formattedDate = format(visitDate, 'yyyy-MM-dd HH:mm')
    const label = isRTL ? `زيارة ميدانية - ${formattedDate}` : `Field Visit - ${formattedDate}`
    
    const url = isApple
      ? `https://maps.apple.com/?q=${lat},${lng}&ll=${lat},${lng}`
      : `https://www.google.com/maps?q=${lat},${lng}&label=${encodeURIComponent(label)}`
    
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (visits.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{isRTL ? 'لا توجد زيارات ميدانية' : 'No field visits recorded'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visits.map((visit) => {
        const distanceFromProperty =
          visit.latitude &&
          visit.longitude &&
          propertyLatitude &&
          propertyLongitude
            ? calculateDistance(
                propertyLatitude,
                propertyLongitude,
                visit.latitude,
                visit.longitude
              )
            : null

        return (
          <div
            key={visit.id}
            className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            {/* Visit Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">{visit.user.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>
                  {format(new Date(visit.visitDate), 'PPp', {
                    locale: isRTL ? ar : undefined,
                  })}
                </span>
              </div>
            </div>

            {/* Visit Notes */}
            {visit.notes && (
              <div className="mb-3 p-3 bg-slate-50 rounded-md">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {visit.notes}
                </p>
              </div>
            )}

            {/* Location Information */}
            {visit.latitude && visit.longitude ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-slate-700 font-mono">
                    {visit.latitude.toFixed(6)}, {visit.longitude.toFixed(6)}
                  </span>
                  {visit.accuracy && (
                    <span className="text-slate-500 text-xs">
                      (±{Math.round(visit.accuracy)}m)
                    </span>
                  )}
                </div>

                {distanceFromProperty !== null && (
                  <div className="text-xs text-slate-600">
                    {isRTL ? 'المسافة من العقار:' : 'Distance from property:'}{' '}
                    <span className="font-medium">
                      {distanceFromProperty < 1000
                        ? `${Math.round(distanceFromProperty)}m`
                        : `${(distanceFromProperty / 1000).toFixed(2)}km`}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => openLocation(visit.latitude!, visit.longitude!, visit.visitDate)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  type="button"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'عرض على الخريطة' : 'View on Map'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : visit.locationError ? (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">
                    {isRTL ? 'لم يتم تسجيل الموقع' : 'Location not recorded'}
                  </p>
                  <p className="text-amber-700 text-xs mt-1">{visit.locationError}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="w-4 h-4" />
                <span>{isRTL ? 'لم يتم تسجيل الموقع' : 'Location not recorded'}</span>
              </div>
            )}
          </div>
        )
      })}

      {/* GPS Disclaimer */}
      <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-md border border-slate-200">
        <p>
          {isRTL
            ? '⚠️ تسجيل الموقع الجغرافي (GPS) هو دليل مساعد على الزيارة الميدانية وليس إثباتاً قطعياً. الاعتماد على الملاحظات والصور المرفقة.'
            : '⚠️ GPS location recording is a supporting indicator of the field visit and not definitive proof. Rely on notes and attached photos.'}
        </p>
      </div>
    </div>
  )
}
