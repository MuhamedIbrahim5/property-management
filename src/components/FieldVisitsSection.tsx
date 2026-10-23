'use client'

import { MapPin, Calendar, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'

type FieldVisit = {
  id: string
  visitDate: Date
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  locationError: string | null
  distanceMeters: number | null
  notes: string | null
  attachments?: Array<{
    id: string
    fileName: string
    filePath: string
    fileType: string
  }>
}

type Property = {
  latitude: number | null
  longitude: number | null
}

interface FieldVisitsSectionProps {
  visits: FieldVisit[]
  property: Property
  proximityThreshold?: number
}

export default function FieldVisitsSection({ 
  visits, 
  property,
  proximityThreshold = 100 // meters
}: FieldVisitsSectionProps) {
  const { language } = useLanguage()

  const getVerificationStatus = (visit: FieldVisit) => {
    if (!visit.latitude || !visit.longitude || !property.latitude || !property.longitude) {
      return {
        status: 'unverified',
        label: language === 'ar' ? 'لم يتم التحقق' : 'Unverified',
        color: 'bg-gray-500'
      }
    }

    if (visit.distanceMeters === null) {
      return {
        status: 'unknown',
        label: language === 'ar' ? 'غير معروف' : 'Unknown',
        color: 'bg-gray-500'
      }
    }

    if (visit.distanceMeters <= proximityThreshold) {
      return {
        status: 'within',
        label: language === 'ar' ? 'داخل النطاق' : 'Within Range',
        color: 'bg-green-500'
      }
    }

    return {
      status: 'outside',
      label: language === 'ar' ? 'خارج النطاق' : 'Outside Range',
      color: 'bg-amber-500'
    }
  }

  const formatDistance = (meters: number | null) => {
    if (meters === null) return '-'
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(2)}km`
  }

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, '_blank')
  }

  if (visits.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{language === 'ar' ? 'لا توجد زيارات ميدانية' : 'No field visits recorded'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {language === 'ar' ? 'الزيارات الميدانية' : 'Field Visits'} ({visits.length})
      </h3>

      {visits.map((visit) => {
        const verification = getVerificationStatus(visit)
        
        return (
          <Card key={visit.id}>
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(visit.visitDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <Badge className={`${verification.color} text-white`}>
                  {verification.label}
                </Badge>
              </div>

              {/* Location Info */}
              {visit.latitude && visit.longitude ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'المسافة:' : 'Distance:'}
                    </span>
                    <span className="ml-2 font-medium">
                      {formatDistance(visit.distanceMeters)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الدقة:' : 'Accuracy:'}
                    </span>
                    <span className="ml-2 font-medium">
                      {visit.accuracy ? `±${Math.round(visit.accuracy)}m` : '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => openInMaps(visit.latitude!, visit.longitude!)}
                    >
                      <MapPin className="h-4 w-4" />
                      {language === 'ar' ? 'فتح في الخرائط' : 'Open in Maps'}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                  <p className="text-amber-800">
                    {visit.locationError || (language === 'ar' ? 'الموقع غير متاح' : 'Location not available')}
                  </p>
                </div>
              )}

              {/* Notes */}
              {visit.notes && (
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium mb-1">
                    {language === 'ar' ? 'الملاحظات:' : 'Notes:'}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {visit.notes}
                  </p>
                </div>
              )}

              {/* Images */}
              {visit.attachments && visit.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {language === 'ar' ? 'الصور' : 'Photos'} ({visit.attachments.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {visit.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square relative rounded overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={attachment.filePath}
                          alt={attachment.fileName}
                          className="object-cover w-full h-full"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
