'use client'

import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'

interface QRPosterProps {
  qrDataUrl: string
  whatsappQR: string
  unitNumber: string
  propertyName: string
  maintenanceUrl: string
  whatsappNumber: string
}

export default function QRPoster({ 
  qrDataUrl, 
  whatsappQR, 
  unitNumber, 
  propertyName,
  maintenanceUrl,
  whatsappNumber
}: QRPosterProps) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const isRTL = language === 'ar'
  
  const [contactInfo, setContactInfo] = useState({
    phoneNumber: '',
    phoneNumber2: '',
    extNumbers: '',
    customerService: '',
    serviceName: ''
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRes = await fetch('/api/public/settings')
        const settingsData = await settingsRes.json()
        const settings = Object.fromEntries(settingsData.map((s: any) => [s.key, s.value]))
        
        setContactInfo({
          phoneNumber: settings.phone_number || '',
          phoneNumber2: settings.phone_number_2 || '',
          extNumbers: settings.ext_numbers || '',
          customerService: settings.customer_service || '',
          serviceName: settings.service_name || ''
        })
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    fetchSettings()
  }, [])

  return (
    <div 
      className="bg-white relative a4-poster" 
      style={{ 
        width: '210mm', 
        height: '297mm', 
        fontFamily: isRTL ? 'Tajawal, Arial, sans-serif' : 'Inter, Arial, sans-serif',
        direction: isRTL ? 'rtl' : 'ltr',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Premium Border Frame */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Outer Navy Border */}
        <div className="absolute inset-[8mm] border-[3px] border-[#1e3a5f]"></div>
        
        {/* Inner Gold Border */}
        <div className="absolute inset-[12mm] border-[2px] border-[#d4af37]"></div>
        
        {/* Corner Decorations - Top Left */}
        <div className="absolute top-[8mm] left-[8mm] w-[20mm] h-[20mm]">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#d4af37]"></div>
          <div className="absolute top-0 left-0 w-[3px] h-full bg-[#d4af37]"></div>
          <div className="absolute top-[4mm] left-[4mm] w-[10mm] h-[10mm] border-t-[2px] border-l-[2px] border-[#1e3a5f]"></div>
          <div className="absolute top-[6mm] left-[6mm] w-[6mm] h-[6mm] border-t-[1px] border-l-[1px] border-[#d4af37]"></div>
        </div>
        
        {/* Corner Decorations - Top Right */}
        <div className="absolute top-[8mm] right-[8mm] w-[20mm] h-[20mm]">
          <div className="absolute top-0 right-0 w-full h-[3px] bg-[#d4af37]"></div>
          <div className="absolute top-0 right-0 w-[3px] h-full bg-[#d4af37]"></div>
          <div className="absolute top-[4mm] right-[4mm] w-[10mm] h-[10mm] border-t-[2px] border-r-[2px] border-[#1e3a5f]"></div>
          <div className="absolute top-[6mm] right-[6mm] w-[6mm] h-[6mm] border-t-[1px] border-r-[1px] border-[#d4af37]"></div>
        </div>
        
        {/* Corner Decorations - Bottom Left */}
        <div className="absolute bottom-[8mm] left-[8mm] w-[20mm] h-[20mm]">
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#d4af37]"></div>
          <div className="absolute bottom-0 left-0 w-[3px] h-full bg-[#d4af37]"></div>
          <div className="absolute bottom-[4mm] left-[4mm] w-[10mm] h-[10mm] border-b-[2px] border-l-[2px] border-[#1e3a5f]"></div>
          <div className="absolute bottom-[6mm] left-[6mm] w-[6mm] h-[6mm] border-b-[1px] border-l-[1px] border-[#d4af37]"></div>
        </div>
        
        {/* Corner Decorations - Bottom Right */}
        <div className="absolute bottom-[8mm] right-[8mm] w-[20mm] h-[20mm]">
          <div className="absolute bottom-0 right-0 w-full h-[3px] bg-[#d4af37]"></div>
          <div className="absolute bottom-0 right-0 w-[3px] h-full bg-[#d4af37]"></div>
          <div className="absolute bottom-[4mm] right-[4mm] w-[10mm] h-[10mm] border-b-[2px] border-r-[2px] border-[#1e3a5f]"></div>
          <div className="absolute bottom-[6mm] right-[6mm] w-[6mm] h-[6mm] border-b-[1px] border-r-[1px] border-[#d4af37]"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-[16mm] py-[14mm] h-full flex flex-col">
        
        {/* Header Section - Compact */}
        <div className="text-center mb-3">
          {/* Logo - Smaller */}
          <div className="mb-3 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-full"></div>
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] shadow-lg border-2 border-[#d4af37]">
                <Building2 className="h-8 w-8 text-[#d4af37]" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          
          {/* Company Name - Compact */}
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-1.5 leading-tight">
            {isRTL ? 'شركة تطوير العقارات' : 'Property Development Company'}
          </h1>
          
          {/* Company Name - Secondary (only show in RTL) - Smaller */}
          {isRTL && (
            <p className="text-sm text-slate-600 mb-2 font-medium">
              Property Development Company
            </p>
          )}
          
          {/* Ornamental Divider - Smaller */}
          <div className="flex items-center justify-center gap-1.5 my-2.5">
            <div className="h-[1.5px] w-16 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-[#d4af37]"></div>
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-[#1e3a5f] transform scale-50"></div>
            </div>
            <div className="h-[1.5px] w-16 bg-gradient-to-l from-transparent via-[#d4af37] to-transparent"></div>
          </div>
          
          {/* System Title - Compact */}
          <p className="text-xs font-semibold text-slate-700 mb-0.5">
            {isRTL ? 'نظام إدارة الصيانة والعقارات' : 'Property Maintenance Management System'}
          </p>
          
          {/* System Title - Secondary (only show in RTL) - Smaller */}
          {isRTL && (
            <p className="text-[10px] text-slate-600">
              Property Maintenance Management System
            </p>
          )}
        </div>

        {/* Unit Info - Compact */}
        <div className="text-center mb-3">
          <div className="border-2 border-[#1e3a5f] rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-white px-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#d4af37]"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-slate-600 mb-0.5">{isRTL ? 'العقار' : 'Property'}</p>
                <p className="text-base font-bold text-[#1e3a5f]">{propertyName}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-600 mb-0.5">{isRTL ? 'رقم الوحدة' : 'Unit Number'}</p>
                <p className="text-base font-bold text-[#1e3a5f]">{unitNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Codes Section - Compact */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Maintenance QR - Smaller */}
          <div className="border-2 border-[#1e3a5f] rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
            <div className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-lg -z-10"></div>
            <div className="bg-white p-2 rounded-md shadow-sm mb-2 border border-slate-200">
              <img 
                src={qrDataUrl} 
                alt="Maintenance QR" 
                className="mx-auto"
                style={{ width: '110px', height: '110px' }}
              />
            </div>
            <p className="text-sm font-bold text-center text-[#1e3a5f] mb-0.5">
              {isRTL ? 'طلب صيانة' : 'Maintenance Request'}
            </p>
            <p className="text-[10px] text-center text-slate-600 font-medium">
              {isRTL ? 'امسح للإرسال' : 'Scan to Submit'}
            </p>
          </div>

          {/* WhatsApp QR - Smaller */}
          <div className="border-2 border-[#1e3a5f] rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
            <div className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-lg -z-10"></div>
            {whatsappQR && whatsappNumber ? (
              <>
                <div className="bg-white p-2 rounded-md shadow-sm mb-2 border border-slate-200">
                  <img 
                    src={whatsappQR} 
                    alt="WhatsApp QR" 
                    className="mx-auto"
                    style={{ width: '110px', height: '110px' }}
                  />
                </div>
                <p className="text-sm font-bold text-center text-[#1e3a5f] mb-0.5">
                  {isRTL ? 'واتساب' : 'WhatsApp'}
                </p>
                <p className="text-[10px] text-center text-green-700 font-bold" dir="ltr">
                  +{whatsappNumber}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[140px]">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 mb-0.5">
                    {isRTL ? 'واتساب غير مفعّل' : 'WhatsApp Not Configured'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isRTL ? 'يرجى الإعداد من لوحة التحكم' : 'Configure in Dashboard Settings'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Steps Section - Very Compact */}
        <div className="mb-3">
          <div className="border-2 border-[#d4af37] rounded-lg p-3 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm">
            <h3 className="text-center text-sm font-bold text-[#1e3a5f] mb-2.5 pb-1.5 border-b-2 border-[#d4af37]">
              {isRTL ? 'خطوات إرسال طلب الصيانة' : 'How to Submit a Maintenance Request'}
            </h3>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                { ar: 'امسح رمز QR', en: 'Scan QR Code' },
                { ar: 'اختر نوع العقار', en: 'Select Property Type' },
                { ar: 'املأ البيانات المطلوبة', en: 'Fill Required Data' },
                { ar: 'اختر نوع المشكلة', en: 'Choose Issue Type' },
                { ar: 'أرفق صور توضيحية', en: 'Attach Photos' },
                { ar: 'احصل على رقم المتابعة', en: 'Get Tracking Number' }
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f]"></div>
                    <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] text-xs font-bold text-[#d4af37]">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1e3a5f] leading-tight mb-0.5">
                      {isRTL ? step.ar : step.en}
                    </p>
                    {isRTL && (
                      <p className="text-[9px] text-slate-600 leading-tight">
                        {step.en}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Information Section - Compact */}
        <div className="mb-2">
          <div className="border-2 border-[#d4af37] rounded-lg px-3 py-2 bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-center text-xs font-bold text-[#1e3a5f] mb-2 pb-1 border-b border-[#d4af37]">
              {isRTL ? 'للتواصل والاستفسار' : 'Contact & Inquiries'}
            </h3>
            
            <div className="space-y-1.5">
              {/* WhatsApp Contact - Compact */}
              {whatsappNumber && contactInfo.serviceName && (
                <div className="flex items-center justify-center gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded px-2 py-1">
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="font-bold text-green-800 text-[10px]">
                      {isRTL ? 'جوال' : 'Mobile'} {contactInfo.serviceName}
                    </span>
                    <span className="font-bold text-green-700" dir="ltr">
                      {whatsappNumber.startsWith('966') ? `0${whatsappNumber.slice(3)}` : whatsappNumber}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Phone Numbers - Compact */}
              {(contactInfo.phoneNumber || contactInfo.phoneNumber2) && (
                <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
                  <span className="font-semibold text-slate-700">
                    {isRTL ? 'ت / ص' : 'Tel'}:
                  </span>
                  <div className="flex items-center gap-1.5" dir="ltr">
                    {contactInfo.phoneNumber && (
                      <span className="font-bold text-[#1e3a5f]">{contactInfo.phoneNumber}</span>
                    )}
                    {contactInfo.phoneNumber && contactInfo.phoneNumber2 && (
                      <span className="text-slate-400">-</span>
                    )}
                    {contactInfo.phoneNumber2 && (
                      <span className="font-bold text-[#1e3a5f]">{contactInfo.phoneNumber2}</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Extensions & Customer Service - Compact */}
              <div className="flex items-center justify-center gap-3 text-[10px] flex-wrap">
                {contactInfo.customerService && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-600">
                      {isRTL ? 'خدمة العملاء' : 'Customer Service'}:
                    </span>
                    <span className="font-bold text-[#d4af37] bg-slate-100 px-1.5 py-0.5 rounded" dir="ltr">
                      {contactInfo.customerService}
                    </span>
                  </div>
                )}
                {contactInfo.extNumbers && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-600">
                      {isRTL ? 'التحويلات' : 'Ext'}.:
                    </span>
                    <span className="font-bold text-slate-700" dir="ltr">
                      {contactInfo.extNumbers}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except poster */
          body > *:not(:has(.a4-poster)) {
            display: none !important;
          }
          
          /* Show only the poster element */
          .a4-poster {
            display: block !important;
          }
          
          /* Force exact A4 size */
          @page {
            size: 210mm 297mm;
            margin: 0mm;
          }
          
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          
          .a4-poster {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: none !important;
          }
          
          /* Preserve colors */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}
