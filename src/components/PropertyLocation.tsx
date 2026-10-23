'use client'

import { MapPin, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface PropertyLocationProps {
  latitude: number | null
  longitude: number | null
  propertyName: string
  neighborhood?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function PropertyLocation({
  latitude,
  longitude,
  propertyName,
  neighborhood,
  size = 'md'
}: PropertyLocationProps) {
  const { isRTL } = useLanguage()

  if (!latitude || !longitude) {
    return (
      <div className={`flex items-center gap-2 text-slate-500 ${size === 'sm' ? 'text-sm' : ''}`}>
        <MapPin className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        <span>{isRTL ? 'الموقع غير محدد' : 'Location not set'}</span>
      </div>
    )
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
  const appleMapsUrl = `https://maps.apple.com/?q=${latitude},${longitude}`

  const handleOpenMaps = () => {
    // Detect platform and open appropriate maps app
    const isApple = /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent)
    const url = isApple ? appleMapsUrl : googleMapsUrl
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`flex flex-col gap-2 ${size === 'sm' ? 'text-sm' : ''}`}>
      <div className="flex items-center gap-2">
        <MapPin className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
        <div className="flex-1">
          <div className="font-medium text-slate-900">
            {propertyName}
            {neighborhood && (
              <span className="text-slate-600 font-normal"> - {neighborhood}</span>
            )}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
        </div>
      </div>
      
      <button
        onClick={handleOpenMaps}
        className={`
          inline-flex items-center justify-center gap-2
          ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
          bg-blue-600 hover:bg-blue-700 text-white rounded-lg
          transition-colors duration-200
          font-medium
        `}
        type="button"
      >
        <MapPin className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>{isRTL ? 'فتح الموقع على الخريطة' : 'Open in Maps'}</span>
        <ExternalLink className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
      
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <span>{isRTL ? 'سيتم فتح الموقع في' : 'Opens in'}</span>
        <span className="font-medium">
          {isRTL ? 'خرائط Google أو Apple Maps' : 'Google Maps or Apple Maps'}
        </span>
      </div>
    </div>
  )
}
